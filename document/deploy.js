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
  
}
  

const stage = ["deploy", "setup", "approval", "finish"];

class Deploy extends React.Component {

    state = {
        url: "",
        hash: "",
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
            if(!this.state.hash) {
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
                    arguments: [parseInt($("#numFirme").val()), that.state.hash]
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

        upload() {
            const file = document.getElementById("textupload").files[0];
            console.log(file)

            // set the new file name uploaded
            document.getElementById('fileName').innerText = file.name;
            var that = this;

            $('.ui.basic.modal').modal({
                onApprove: async function (e) {
                    const hash = await ipfs.add(file, (err, res) => {
                        if (err) {
                        console.log('ipfs add error')
                        } else {
                            console.log(res);
                        }
                    });
                    console.log(hash.path);
                    that.setHash(hash.path);
                    that.setUrl();
                    
                },
            }).modal('show');
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
            this.setState({url: "http://localhost:8080/ipfs/"});
        }

        setHash(hash) {
            this.setState({hash: hash});
        }

render() {

    var href = (this.state.status == Status.SETUP) ? ("app.html?contract=") : "#";
    var disabledDoc = "ui disabled input";
    if(this.state.hash) {
        disabledDoc = "";
    }
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
                            <button type="button" className="ui button" onClick={this.deploy.bind(this)}>Deploy</button>
                        </div>
                        <div className="field">
                            <a className={disabled} href={href} >Clicca qui per interagire con il contratto {this.state.contractAddress}</a>
                        </div>
                    </form>
                </div>
                <div className="ui basic modal">
                    <div className="ui icon header">
                        <i className="cloud upload icon"></i>
                        Caricamento del file
                    </div>
                    <div className="content centered">
                        <p>Confermare di voler caricare il file su IPFS?</p>
                    </div>
                    <div className="actions centered">
                        <div className="ui red basic cancel inverted button">
                            <i className="remove icon"></i>
                            No
                        </div>
                        <div className="ui green ok inverted button">
                            <i className="checkmark icon"></i>
                            Yes
                        </div>
                    </div>
                </div>
                <div className="column">
                    <h2 className="ui header">
                        Carica il file su un File System decentralizzato - IPFS
                    </h2>
                    <form className="ui form">
                        <label id="fileName" htmlFor="textupload" className="ui icon button">
                            <i  className="file icon"></i>
                            Seleziona il file
                        </label>
                        <input type="file" id="textupload" onChange={this.upload.bind(this)} className="ui file input"/>
                    </form>
                        <iframe src={this.state.url + this.state.hash} width="600" height="600" scrolling="auto" frameBorder="1">
                            La pagina corrente utilizza i frame. Questa caratteristica non è supportata dal browser in uso.
                            <a href="pagina1.htm">Clicca qui</a>
                        </iframe>
                        <a href={this.state.url + this.state.hash} className={disabledDoc}>Apri il documento</a>
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
var ipfs = IpfsHttpClient('/ip4/127.0.0.1/tcp/5001')
