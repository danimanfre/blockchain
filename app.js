'use strict';

window.addEventListener('load', async () => {

    var myWeb3;
    var account;
    var abi;
    var bytecode;
    var contract;
    var contractRemix

    // Modern dapp browsers...
    if (window.ethereum) {

        window.myWeb3 = new Web3(window.ethereum);

        var web3 = window.myWeb3;

        console.log("INIZIO")
        window.ethereum.enable();
        window.accounts = await web3.eth.getAccounts();

        console.log( "window.accounts",window.accounts)

        /*
        window.myWeb3.eth.getAccounts((error,result) => {
            if (error) {
                console.log(error);
            } else {
                console.log(result);

                web3.eth.getBalance(address [, defaultBlock] [, callback])
            }
        });
        */
        console.log("FINE")

        /*
        window.myWeb3 = new Web3(ethereum);
        
        account = window.myWeb3.eth.accounts[0]

        try {
            // Request account access if needed
            await ethereum.enable();
            window.accounts = await web3.eth.getAccounts();
            // Acccounts now exposed
            
        } catch (error) {
            // User denied account access...
        }
        */
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

    window.web3.version.api = "1.2.9"

    // set the account
    web3.eth.getAccounts(function (error, result) {
        window.account = result;
    });




    // get json ABI and create contract
    $.get("./bin/Storage.abi", function(data) {
        window.abi = JSON.parse(data);
        console.log(window.myWeb3.version)
        window.contract = new web3.eth.Contract(window.abi,  {
            from: window.account, // default from address
            gasPrice: '20000000000' // default gas price in wei, 20 gwei in this case
        });
    })

    // get bytecode of contract
    $.get("./bin/Storage.bin", function(data) {
        window.bytecode = data;

    });

    // connect to Remix Storage contract 



    // set action to button retreive
    $("#retreive").click(function() {
        window.contract.methods.retrieve().call(function(error, result) {
            if(!error) {
                console.log(result);
                $("#label").text(result);
            }
        });
    });
    
    // set action to button store
    $("#store").click(function() {
        if($("#input").val() != null) {
            console.log(account)
            window.contract.methods.store(parseInt($("#input").val())).send({from: window.account[0]});
            $("#input").val("");
        }
    });

    // set action to button deploy
    $("#deploy").click(function() {
        window.deploy = window.contract.deploy({
            data: '0x' + window.bytecode,
            });
            window.deploy.estimateGas(function(err, gas){
                console.log(gas);
            });
            window.deploy.send({
                from: window.account[0],
                gas: 100000,
                gasPrice: '3000000',
            }).on('error', function(error){ console.log("error" + error) })
            .then(function(newContractInstance){
                console.log(newContractInstance.options) // instance with the new contract address
                window.contract.options.address = newContractInstance.options.address;
                window.contract.options.gasPrice = '3000000'; // default gas price in wei
                window.contract.options.gas = 5000000; // provide as fallback always 5M gas
                window.contract.options.data = '0x' + window.bytecode;
            });
    });
});







