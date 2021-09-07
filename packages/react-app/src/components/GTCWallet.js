import { useState, useEffect } from 'react'
import { Card, Button } from 'antd';
import { useContractExistsAtAddress, useContractLoader } from "../hooks";


const GTCWallet = ({ provider, chainId, address, userSigner, tx }) => {
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState('')
    const [eventCounter, setEventCounter] = useState(0)
    const [isMinted, setIsMinted] = useState(false)



    const contracts = useContractLoader(provider, { chainId });
    let contract;
    contract = contracts ? contracts["GTC"] : "";


    const contractAddress = contract ? contract.address : "";
    const contractIsDeployed = useContractExistsAtAddress(provider, contractAddress);

    useEffect(() => {
        if (contract) {
            contract.balanceOf(address).then((balance) => setBalance(String(balance)))
            contract.minted(address).then(isMinted => setIsMinted(isMinted)).catch(err => console.log(err))
            setLoading(false)

        }
    }, [eventCounter, contract])



    if (!contractIsDeployed) return (
        <div>
            Contract is not deployed
        </div>
    )

    contract.on("Transfer", () => {
        console.log('Some Event Happened')
        setEventCounter(eventCounter + 1)
    });

    return (
        <div style={{ padding: 16 }} >

            <Card title={`Your GTC balance is: ${loading ? 'Loading ...' : balance}`} >
                <Button disabled={isMinted} onClick={() => {
                    tx(contract.connect(userSigner).getToken())
                }}>Grab Some GTC</Button>
            </Card>
        </div>
    )
}

export default GTCWallet