

'use strict';


const Status = {
    DEPLOY: "deploy",
    SETUP: "setup",
    APPROVAL: "approval",
    FINISH: "finish"
}

const stage = ["deploy", "setup", "approval", "finish"];

class App extends React.Component {

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

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        this.contractAddress = urlParams.get('contract');
        
        console.log(this.contractAddress);

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

        window.contract.options.address = this.state.contractAddress;

        this.interval = setInterval(() => this.setState({ time: Date.now() }), 10000);
        
    }


    componentWillUnmount() {
        clearInterval(this.interval);
    }
    

    componentWillUpdate(nextProps, nextState) {
        var that = this;
        /*this.getNumOfAbstained.bind(this);
        this.getNumOfOpposed.bind(this);
        this.getNumOfSignatures.bind(this);
        this.getStatus;*/
        if(window.contract.options.address != null) {
            window.contract.methods.getStatus().call(function(error, result) {
                if(!error) {
                    if(that.state.status != result) {
                        that.setState({ status: stage[result] })
                    }
                    return result;
                }
            })
        
            
            window.contract.methods.getNumOfSignatures().call(function(error, result) {
                if(!error) {
                    if(that.state.count != result) {
                        that.setState({ count: result })
                    }
                    return result;
                }
            });
            
            window.contract.methods.getNumOfOpposed().call(function(error, result) {
                if(!error) {
                    if(that.state.opposed != result) {
                        that.setState({ opposed: result })
                    }
                    return result;
                }
            });
            
            window.contract.methods.getNumOfAbstained().call(function(error, result) {
                if(!error) {
                    if(that.state.abstained != result) {
                        that.setState({ abstained: result })
                    }
                    return result;
                }
            });

            if(that.state.status == Status.FINISH) {
                window.contract.methods.isDocumentApproved().call(function(error, result) {
                    if(!error) {
                        if(that.state.isApproved != result) {
                            that.setState({isApproved: result});
                        }
                        
                    }
                });
        
                window.contract.methods.isApprovedByAbsoluteMajority().call(function(error, result) {
                    if(!error) {
                        if(that.state.isAbsoluteApproved != result) {
                            that.setState({isAbsoluteApproved: result});
                        }
                    }
                });
        
                window.contract.methods.isApprovedByRelativeMajority().call(function(error, result) {
                    if(!error) {
                        if(that.state.isRelativeApproved != result) {
                            that.setState({isRelativeApproved: result});
                        }
                    }
                });
            }
        
            
        }

        
    }

    deploy() {
        if(!this.state.url) {
            alert("Inserire prima un documento da approvare")
            return
        }
        setAccount();
        var that = this;
        if (!$("#numFirme").val() || $("#numFirme").val() == 0) {
            alert("Inserire un valore diverso da 0")
        } else {
            window.deploy = window.contract.deploy({
                data: '0x' + window.bytecode,
                arguments: [parseInt($("#numFirme").val())]
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
                that.setState({ document: newContractInstance.options.address})
                that.startSetup();
            });
            $("#numFirme").val("");
        }
    }

    connectToContract(e) {
        window.contract.options.address = $("#address").val();
        console.log(window.contract.options.address)
        this.setState({ document: $("#address").val()})
        this.getNumOfSignatures();
        this.getNumOfOpposed();
        this.getNumOfAbstained();
        this.getStatus();
        $("#address").val("");

    }

    
    async sign() {
        await setAccount();
        var that = this;
        var numFirm;
        window.contract.methods.sign().send({from: window.account[0]})
        .then(function(result){
            that.getNumOfSignatures();
            that.getNumOfAbstained();
        });
    }

    refuse() {
        setAccount();
        var that = this;
        window.contract.methods.refuse().send({from: window.account[0]})
        .then(function(result){ 
            that.getNumOfOpposed();
            that.getNumOfAbstained();
        })
    }

    getNumOfSignatures() {
        setAccount();
        var that = this;
        window.contract.methods.getNumOfSignatures().call(function(error, result) {
            if(!error) {
                that.setState({ count: result })
                return result;
            }
        });
    }

    getNumOfOpposed() {
        setAccount();
        var that = this;
        window.contract.methods.getNumOfOpposed().call(function(error, result) {
            if(!error) {
                that.setState({ opposed: result })
                return result;
            }
        });
    }

    getNumOfAbstained() {
        setAccount();
        var that = this;
        window.contract.methods.getNumOfAbstained().call(function(error, result) {
            if(!error) {
                that.setState({ abstained: result })
                return result;
            }
        });
    }

    isDocumentApproved() {
        setAccount();
        window.contract.methods.isDocumentApproved().call(function(error, result) {
            if(!error && result) {
                alert("Il contratto è approvato.");
            } else {
                alert("Il contratto non approvato.");
            }
        });
    }

    async giveRightToSign() {
        await setAccount();
        window.contract.methods.giveRightToSign($("#rightToSign").val()).send({from: window.account[0]});
        $("#rightToSign").val("");
    }

    startApproval() {
        setAccount();
        var that = this;
        window.contract.methods.startApproval().send({from: window.account[0]})
        .then(function(result){ 
            that.getStatus();
            that.getNumOfSignatures();
            that.getNumOfAbstained();
            that.getNumOfOpposed();
        });
    }

    startSetup() {
        setAccount();
        var that = this;
        window.contract.methods.startSetup().send({from: window.account[0]})
        .then(function(result){ 
            that.getStatus();
        });
    }

    endApproval() {
        setAccount();
        var that = this;
        window.contract.methods.endApproval().send({from: window.account[0]})
        .then(function(result){ 
            that.getStatus();
            that.getResult();
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

    getResult() {
        var that = this;
        window.contract.methods.isDocumentApproved().call(function(error, result) {
            if(!error) {
                that.setState({isApproved: result});
            }
        });

        window.contract.methods.isApprovedByAbsoluteMajority().call(function(error, result) {
            if(!error) {
                that.setState({isAbsoluteApproved: result});
            }
        });

        window.contract.methods.isApprovedByRelativeMajority().call(function(error, result) {
            if(!error) {
                that.setState({isRelativeApproved: result});
            }
        });
    }

    setUrl() {
        this.setState({url: $("#url").val()})
        var that = this;
        console.log(that.state.url)
        /*$.ajax({
            url: that.state.url,
            type: 'GET',
            success: function (result) {
                 alert("SUCCESS");
            },
            async: false
        });


        sha1('Message to hash');*/
    }

    render() {
        return (
            <div className="ui segment">
                <div className="ui two column very relaxed grid">
                    <div className="column">
                        <h1 className="ui huge header">Approvazione Documento</h1>
                        <label id="document">{this.state.document}</label>
                        <form className="ui form">

                            <div className="field">
                                <label>Abilita a firmare:</label>
                                <input id="rightToSign" type="text"/>
                                <button type="button" className="ui button" disabled={!(this.state.status == Status.SETUP)} onClick={this.giveRightToSign}>Abilita</button>
                            </div>

                            <div className="field">
                                <label>Azioni:</label>
                                <button type="button" className="ui positive button" disabled={!(this.state.status == Status.APPROVAL)} onClick={this.sign.bind(this)}>Firma</button>
                                <button type="button" className="ui negative  button" disabled={!(this.state.status == Status.APPROVAL)} onClick={this.refuse.bind(this)}>Rifiuta</button>
                            </div>

                            <div className="field">
                                <label>Numero di firmatari:</label>
                                <table className="ui celled table">
                                    <thead>
                                        <tr>
                                            <th>Favorevoli</th>
                                            <th>Contrari</th>
                                            <th>In attesa</th>
                                            <th>Totale</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td data-label="Favorevoli">{this.state.count}</td>
                                            <td data-label="Contrari">{this.state.opposed}</td>
                                            <td data-label="In attesa">{this.state.abstained}</td>
                                            <td data-label="Totale">{parseInt(this.state.count) + parseInt(this.state.opposed) + parseInt(this.state.abstained)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="field">
                                <label>Gestisci:</label>
                                <button type="button" className="ui button" disabled={!(this.state.status == Status.SETUP)} onClick={this.startApproval.bind(this)}>Inizia approvazione</button>
                                <button type="button" className="ui button" disabled={!(this.state.status == Status.APPROVAL)} onClick={this.endApproval.bind(this)}>Termina approvazione</button>
                            </div>
                
                            <div className="field">
                                <label>Stato del contratto: {this.state.status}</label>
                            </div>
                
                            <div className="field">
                                <div className="ui checkbox"> 
                                    <input type="checkbox" checked={this.state.isAbsoluteApproved ? "checked" : ""} disabled id="ma"></input>
                                    <label>Maggioranza assoluta</label>
                                </div>
                            </div>
                    
                            <div className="field">
                                <div className="ui checkbox">
                                    <input checked={this.state.isRelativeApproved ? "checked" : ""} type="checkbox" disabled id="me"></input>
                                    <label>Maggioranza relativa</label>
                                </div>
                            </div>
                    
                            <div className="field">
                                <div className="ui checkbox">
                                    <input type="checkbox" checked={this.state.isApproved ? "checked" : ""} disabled></input>
                                    <label>Approvato</label>
                                </div>
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

ReactDOM.render(<App/>, document.getElementById('root'));

function setAccount() {
    web3.eth.getAccounts(function (error, result) {
        window.account = result;
    });
}