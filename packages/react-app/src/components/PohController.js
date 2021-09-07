import {  useState, useEffect} from 'react'
import { Card, Button } from 'antd';
import AddressInput from './AddressInput'
import { useContractExistsAtAddress, useContractLoader } from "../hooks";

const PoHController = ({ provider, chainId, address, userSigner, tx }) => {
    const [loading, setLoading] = useState(true)
    const [isHuman, setIsHuman] = useState(false)
    const [eventCounter, setEventCounter] = useState(0)
    const [targetAddress, setAddress] = useState("")

    const contracts = useContractLoader(provider, { chainId });
    let contract;
    contract = contracts ? contracts["POHmimic"] : "";


    const contractAddress = contract ? contract.address : "";
    const contractIsDeployed = useContractExistsAtAddress(provider, contractAddress);

    useEffect(() => {
        setLoading(true)
        if (contract) {
            contract.isRegistered(address).then((isIt) => setIsHuman(isIt))
            setLoading(false)
        }
    }, [eventCounter, contract])

    useEffect(() => {
         setInterval(() => {
            setEventCounter(eventCounter+1)
        }, 10 * 1000)
    }, [])


    if (!contractIsDeployed) return (
        <div>
            Contract is not deployed
        </div>
    )

    return (
        <div style={{ padding: 16 }} >
            <Card title={!loading ? isHuman ? 'Wow, You are a human!' : 'Sorry, you\'r not a human, ehem, YET!' : 'Loading ...'} >
                <div style={{ padding: 8 }}>
                    <AddressInput value={targetAddress} onChange={setAddress} />
                    <Button disabled={!targetAddress} onClick={() => {
                        tx(contract.connect(userSigner).register(targetAddress))
                        setEventCounter(eventCounter+1)
                        setAddress('')
                    }} style={{ marginTop: 8 }}>
                        Make this Address Human
                    </Button>
                </div>

            </Card>
        </div>

    )

}

export default PoHController;