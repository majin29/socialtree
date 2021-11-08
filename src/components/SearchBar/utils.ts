import * as tyron from 'tyron';

export const isValidUsername = (username: string) =>
    /^[\w\d_]+$/.test(username) && username.length > 6;

export const initTyron = '0xc85Bc1768CA028039Ceb733b881586D6293A1d4F'; // @todo Resolver.InitTyron.Testnet vs env variable
    
export const fetchAddr = async ({
    net,
    username,
    domain
}: {
    net: string;
    username: string;
    domain: string;
}) => {
    let network = tyron.DidScheme.NetworkNamespace.Testnet;
    switch (net) {
        case 'mainnet':
            network = tyron.DidScheme.NetworkNamespace.Mainnet;
    }
    const addr = await tyron.Resolver.default
    .resolveDns(network, initTyron, username, domain)
    .catch((err) => {
        throw err;
    });
    return addr;
};

export const resolve = async ({
    net,
    addr
}: {
    net: string;
    addr: string;
}) => {
    let network = tyron.DidScheme.NetworkNamespace.Testnet;
    if( net === 'mainnet') {
        network = tyron.DidScheme.NetworkNamespace.Mainnet;
    }
    const did_doc: any[] = [];
    const state = await tyron.State.default.fetch(network, addr);

    let did;
    if( state.did == ''){
        did = 'not created yet.'
    } else {
        did = state.did
    }
    did_doc.push(['Decentralized identifier', did]);
    
    const controller = state.controller;

    if( state.services_ && state.services_?.size !== 0 ) {
        
        const services = [];
        for( const id of state.services_.keys() ) {
            const result = state.services_.get(id);
            if( result && result[1] !== '' ){
                services.push([id, result[1]])
            }
        }
        did_doc.push(['DID services', services]);
    }
    
    if( state.verification_methods ){
        if ( state.verification_methods.get('socialrecovery') ) {
            did_doc.push([
                'DID social recovery key',
                [state.verification_methods.get('socialrecovery')]
            ]);
        }
        if ( state.verification_methods.get('dex') ) {
            did_doc.push([
                'DID decentralized exchange key',
                [state.verification_methods.get('dex')]
            ]);
        }
        if ( state.verification_methods.get('stake') ) {
            did_doc.push([
                'DID staking key',
                [state.verification_methods.get('stake')]
            ]);
        }
        if ( state.verification_methods.get('general') ) {
            did_doc.push([
                'General-purpose key',
                [state.verification_methods.get('general')]
            ]);
        }
        if ( state.verification_methods.get('authentication') ) {
            did_doc.push([
                'Authentication key',
                [state.verification_methods.get('authentication')]
            ]);
        }
        if( state.verification_methods.get('assertion') ) {
            did_doc.push([
                'Assertion key',
                [state.verification_methods.get('assertion')]
            ]);
        }
        if( state.verification_methods.get('agreement') ) {
            did_doc.push([
                'Agreement key: ',
                [state.verification_methods.get('agreement')]
            ]);
        }
        if( state.verification_methods.get('invocation') ) {
            did_doc.push([
                'Invocation key',
                [state.verification_methods.get('invocation')]
            ]);
        }
        if( state.verification_methods.get('delegation') ) {
            did_doc.push([
                'Delegation key',
                [state.verification_methods.get('delegation')]
            ]);
        }
    }

    /*const init = new tyron.ZilliqaInit.default(network);      
    const guardians = await init.API.blockchain.getSmartContractSubState(
        addr,
        'social_guardians'
    );
    alert(JSON.stringify(guardians))*/

    return {
        status: state.did_status,
        controller: controller,
        doc: did_doc,
        dkms: state.dkms
    };
};
