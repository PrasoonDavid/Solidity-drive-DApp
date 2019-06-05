import React, { Component } from "react";
import SolidityDriveContract from "./contracts/SolidityDrive.json";
import getWeb3 from "./utils/getWeb3";
import { StyledDropZone } from 'react-drop-zone';
import 'react-drop-zone/dist/styles.css';
import 'bootstrap/dist/css/bootstrap.css';
import {Table} from 'reactstrap';
import fileReaderPullStream from 'pull-file-reader';
import Fileicon ,{defaultStyles}  from 'react-file-icon';
import ipfs from './utils/ipfs';
import Moment from 'react-moment';
import "./App.css";

class App extends Component {
  state = { solidityDrive: [], web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SolidityDriveContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SolidityDriveContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.getFiles);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };
  getFiles= async()=>
  {
try {
    const { accounts,contract} = this.state;
  let filelength= await contract.methods.getLength().call({from:accounts[0]});
  let files=[]
  for (let i = 0; i < filelength; i++) 
  {
    let file=await contract.methods.getFile(i).call({from:accounts[0]});
    files.push(file);
  }
 this.setState({solidityDrive : files});

    } catch (error) {
      console.log(error);
    }
 
  }
  onDrop = async(file)=>
  {
    try {
      const { accounts,contract} = this.state;
      const stream=fileReaderPullStream(file);
      const result =ipfs.add(stream);
      const filename=file.name;
      const timestamp= Math.round(+new Date()/1000);
      const type=file.name.substr(file.name.lastIndexOf(".")+1);
      let uploaded=await contract.methods.add(result[0].hash,filename,type,timestamp);
      console.log(uploaded);
      this.getFiles();

    } catch (error) {
      console.log(error);
    }

  }

  render() {
    const {solidityDrive} =this.state;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
    <div className ="App">
    <div className ="container pt-3"  >
    <StyledDropZone onDrop={this.onDrop}/>
    <Table>
      <thead>
      <tr>
      <th width="7%" scope="row">FileType</th>
      <th className="text-left">Filename</th>
      <th className="text-right">Date</th>
      </tr>
      </thead>
      <tbody>
        {solidityDrive !==[] ? solidityDrive.map((item,key) => (
          <tr>
          <th><Fileicon size={30} extension={item[2]} {...defaultStyles[item[2]]}/></th>
          <th className="text-left">{item[1]}</th>
          <th className="text-right">
            <Moment format="YYYY/MM/DD" uinx>{item[3]}</Moment>
          </th>
        </tr>
        )):null}
        
      </tbody>
    </Table>
    </div>
    </div>
    );
  }
}

export default App;
