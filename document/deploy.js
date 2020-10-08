const Status = {
    DEPLOY: "deploy",
    SETUP: "setup",
    APPROVAL: "approval",
    FINISH: "finish"
}

function showIPFSImage() {
    console.log("funzione chiamata");
    // Create the IPFS node instance
    const node = Ipfs.create();
    console.log(node);
  
    // prepare the node
    /*node.on('ready', () => {
      // cat to get the image from IPFS, beware it will take a few seconds
      // And you may need to keep that image ready on a small droplet server that will serve as a sort of CDN to your IPFS content
      // if no other node in the IPFS network has it
      node.files.cat('QmaGKQHKGWe2xsjF7x6djTxB7tt5kyFG9LPLPXUd2c4Nxq', function (err, file) {
        if (err) {
          throw err
        }
  
        // converting the received data into an "image"
        var bytes = new Uint8Array(file);
  
        var image = document.getElementById('IdOfImage'); // IdOfImage is the id attribute of the img tag in your html page
        image.src = "data:image/png;base64," + encode(bytes);  
  
      })
  
      // You may need to stop your node if it became unnecessary
      //node.stop(() => {
        // node is now 'offline'
      //})
    })*/
  }
  

const stage = ["deploy", "setup", "approval", "finish"];

class Deploy extends React.Component {

    state = {
        url: "https://www.solidrules.com/portal/it/assets/media/Brochure_it/solidrules_it.pdf",
        blocking: true,
        contractAddress: "",
        time: new Date(),
        count: 0,
        approved: 0,
        opposed: 0,
        abstained: 0,
        signitarories: 0,
        status: "deploy",
        document: "",
        isAbsoluteApproved: false,
        isRelativeApproved: false,
        isApproved: false}

        constructor(props) {
            super(props);
            
            // get json ABI and create contract
            $.get("../bin/document/Document.abi", function(data) {
                window.abi = JSON.parse(data);
                window.contract = new myWeb3.eth.Contract(window.abi,  {
                    from: window.account, // default from address
                    gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
                });
            })
    
            // get bytecode of contract
            $.get("../bin/document/Document.bin", function(data) {
                window.bytecode = data;
            });
            $('#ipfs').onclick = showIPFSImage();
    
        }

        async componentDidMount() {
            if (window.ethereum) {
    
                window.myWeb3 = new Web3(window.ethereum);
        
                var web3 = window.myWeb3;
        
                window.ethereum.enable();
                window.accounts = await web3.eth.getAccounts();
        
                console.log( "window.accounts",window.accounts)
            }
            // Legacy dapp browsers...
            else if (window.web3) {
                window.myWeb3 = new Web3(web3.currentProvider);
                // Acccounts always exposed
                web3.eth.sendTransaction({/* ... */});
            }
            // Non-dapp browsers...
            else {
                console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
            }
        
        
            // set the account
            web3.eth.getAccounts(function (error, result) {
                window.account = result;
            });
    
            window.ethereum.on('accountsChanged', function (accounts) {
                web3.eth.getAccounts(function (error, result) {
                    window.account = result;
                });
              })
    
            this.interval = setInterval(() => this.setState({ time: Date.now() }), 10000);
            
        }

        componentWillUnmount() {
            clearInterval(this.interval);
        }

        deploy() {
            if(!this.state.url) {
                alert("Inserire prima un documento da approvare")
                return
            }
            //setAccount();
            var that = this;
            if (!$("#numFirme").val() || $("#numFirme").val() == 0) {
                alert("Inserire un valore diverso da 0")
            } else {
                console.log(that.state.url)
                window.deploy = window.contract.deploy({
                    data: '0x' + window.bytecode,
                    arguments: [parseInt($("#numFirme").val()), that.state.url]
                }).send({
                    from: window.account[0],
                    gas: 1000000 ,
                    gasPrice: '5000000',
                }).on('error', function(error) { 
                    console.log("error" + error) 
                }).then(function(newContractInstance){
                    console.log(newContractInstance.options.address) // instance with the new contract address
                    window.contract.options.address = newContractInstance.options.address;
                    window.contract.options.gasPrice = '5000000'; // default gas price in wei
                    window.contract.options.gas = 5000000; // provide as fallback always 5M gas
                    window.contract.options.data = '0x' + window.bytecode;
                    that.setState({ contractAddress: newContractInstance.options.address})
                    that.startSetup();
                });
                $("#numFirme").val("");
            }
        }

        connectToContract(e) {
            window.contract.options.address = $("#address").val();
            console.log(window.contract.options.address)
            $("#address").val("");

            window.location.href = '../app.html?contract='  +  window.contract.options.address;
    
        }

        startSetup() {
            var that = this;
            window.contract.methods.startSetup().send({from: window.account[0]})
            .then(function(result){
                that.getStatus();
            });
        }

        getStatus() {
            var that = this;
            window.contract.methods.getStatus().call(function(error, result) {
                if(!error) {
                    that.setState({ status: stage[result] })
                    return result;
                }
            })
        }

        setUrl() {
            this.setState({url: $("#url").val()})
            var that = this;
            console.log(that.state.url)

        }

render() {

    var href = (this.state.status == Status.SETUP) ? ("app.html?contract=") : "#";
    var disabled = "ui disabled input";
    if(href != "#") {
        href += this.state.contractAddress;
        disabled = "";
    }

    return (
        <div className="ui segment">
            <div className="ui two column very relaxed grid">
                <div className="column">
                    <h1 className="ui huge header">Deploy Documento</h1>
                    <label id="document">{this.state.document}</label>
                    <form className="ui form">
                        <div className="field">
                            <label>Selezionare il numero di firme richieste:</label>
                            <input id="numFirme" type="number"/>
                            <button type="button" className="ui button"  onClick={this.deploy.bind(this)}>Deploy</button>
                        </div>
                        <div className="field">
                            <a className={disabled} href={href} >Clicca qui per interagire con il contratto {this.state.contractAddress}</a>
                        </div>
                    </form>
                </div>
                <div className="column">
                        <div className="ui input">
                                <label>Selezionare l'url del file:</label>
                                <input id="url" type="text" />
                                <button type="button" className="ui button" disabled={!(this.state.status == Status.DEPLOY)} onClick={this.setUrl.bind(this)}>Conferma</button>
                            </div>
                        <iframe src={this.state.url} width="600" height="600" scrolling="auto" frameBorder="1">
                            La pagina corrente utilizza i frame. Questa caratteristica non è supportata dal browser in uso.
                            <a href="pagina1.htm">Clicca qui</a>
                        </iframe>
                    </div>
            </div>
            
            <div className="ui vertical divider">
                {"->"}
            </div>
        </div> 
      );
    }
};


ReactDOM.render(<Deploy/>, document.getElementById('root'));