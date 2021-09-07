import { useEffect, useState } from 'react'
import { Row, Col, Card, Image, Divider, Typography, Tag, Button, Checkbox, Form, Input, Upload, Select } from 'antd'
import { useParams, useHistory } from 'react-router-dom'
import { InfoCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { useContractExistsAtAddress, useContractLoader } from "../hooks";
import { Contract } from 'ethers'
import GrantContract from '../contracts/Grant.json'
import Address from './Address'
const ipfsAPI = require("ipfs-http-client");

const ipfsGateway = "https://ipfs.io/ipfs/";

const { Text, Link } = Typography

const infura = { host: "ipfs.infura.io", port: "5001", protocol: "https" };

const ipfs = ipfsAPI(infura);

const GrantCard = ({ grantId, provider, chainId, userSigner, mainnetProvider }) => {
    const [loading, setLoading] = useState(true)
    const [grantAddress, setGrantAddress] = useState("")
    const [grantBasicStates, setGrantBasicStates] = useState()
    const [grantContract, setGrantContract] = useState(null)
    const [grantData, setGrantData] = useState()

    const history = useHistory()

    const contracts = useContractLoader(provider, { chainId });
    let contract;
    contract = contracts ? contracts["GrantManager"] : "";

    const contractAddress = contract ? contract.address : "";
    const contractIsDeployed = useContractExistsAtAddress(provider, contractAddress);

    const getGrantBasicStates = async (grant) => {
        const grantHash = await grant.grantHash()
        const owner = await grant.owner()
        const bountyAmount = await grant.bountyAmount()
        const version = await grant.version()
        const status = await grant.status()
        const result = await grant.result()
        const currentVotesCounts = await grant.currentVotesCounts()
        const confidence = await grant.confidence()
        return {
            grantHash,
            owner,
            bountyAmount,
            version,
            status,
            result,
            currentVotesCounts,
            confidence
        }
    }


    useEffect(() => {
        if (contract) {
            contract.grants(Number(grantId)).then((grantAddress) => {
                setGrantAddress(grantAddress)
                setLoading(false)
            }).catch(err => {
                console.log(err)
                setLoading(false)
            })
        }
    }, [contract])

    useEffect(async () => {
        if (grantAddress) {
            const grant = new Contract(grantAddress, GrantContract.abi, userSigner)

            setGrantContract(grant)
            const grantBasics = await getGrantBasicStates(grant)
            setGrantBasicStates(grantBasics)
            fetch(`${ipfsGateway}/${grantBasics.grantHash}`).then((result) => {
                return result.json()
            })
                .then((data) => {
                    setGrantData(data)
                })
                .catch(err => {
                    console.log(err)
                })

        }
        // Let's work with contract statuses
        // console.log(Contract, GrantContract.abi, userSigner)

        // console.log(grant)

    }, [grantAddress])

    if (!contractIsDeployed) return (
        <div>
            Contract is not deployed
        </div>
    )
    const data = grantData
    const basics = grantBasicStates

    if (loading || !data || !basics) return (
        <div>Loading ...</div>
    )

    if (!grantAddress) return (
        <div>404! Not found any grant with this ID!</div>
    )


    return (
        <div onClick={() => history.push(`/grant/${grantId}`)} style={{ padding: '2em', cursor:"pointer" }}>
            <Card title={data.name}>
                <Image style={{ width: '100%' }} src={`${ipfsGateway}/${data.image}`} />
                <Divider />
                <Text>
                    {data.description}
                </Text>
                <Divider />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: '1em' }}>
                    <Text type="secondary">Owner: </Text>
                    <Address
                        address={basics.owner}
                        ensProvider={mainnetProvider}
                        fontSize={16}
                    />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: '1em' }}>
                    <Text type="secondary">Category: </Text>
                    <Text >{data.category}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: '1em' }}>
                    <Link href={`https://twitter.com/${data.properties.twitterHandle}`} target="_blank">
                        Twitter
                    </Link>

                    {!!data.properties.projectWebsite && <Link href={`${data.properties.projectWebsite}`} target="_blank">
                        Website
                    </Link>}
                    {!!data.properties.projectGithub && <Link href={`${data.properties.projectGithub}`} target="_blank">
                        Github
                    </Link>}
                </div>
                <Divider />
                {!!data.properties?.keywords?.length && <div>
                    {data.properties?.keywords.map(keyword => <Tag key={keyword}>{keyword}</Tag>)}
                </div>}

            </Card>
        </div>
    )
}

const Grants = ({ provider, chainId, address, userSigner, tx, mainnetProvider }) => {
    const [loading, setLoading] = useState(true)
    const [isHuman, setIsHuman] = useState(false)
    const [eventCounter, setEventCounter] = useState(0)
    const [grantsLength, setGrantLength] = useState(0)
    const [targetAddress, setAddress] = useState("")

    const contracts = useContractLoader(provider, { chainId });
    let contract;
    contract = contracts ? contracts["GrantManager"] : "";


    const contractAddress = contract ? contract.address : "";
    const contractIsDeployed = useContractExistsAtAddress(provider, contractAddress);


    useEffect(async () => {
        if (grantsLength > 1) {
            let foo = Array(grantsLength).fill(0).map(async (v, i) => await (contract.grant(i)))
            console.log(foo)
        }
    }, [grantsLength])



    useEffect(async () => {
        setLoading(true)
        if (contract) {
            const grantLength = await contract.grantsAmount()
            setGrantLength(grantLength)
            setLoading(false)
        }
    }, [eventCounter, contract])

    useEffect(() => {
        setInterval(() => {
            setEventCounter(eventCounter + 1)
        }, 10 * 1000)
    }, [])


    if (!contractIsDeployed) return (
        <div style={{ marginTop: '2em' }}>
            Contract is not deployed
        </div>
    )

    if (grantsLength < 1) return (
        <div style={{ marginTop: '2em' }}>
            There is no grants yet. Create on by going to utility page.
        </div>
    )

    return (
        <div style={{ padding: 16 }} >
            <Row>
                {Array(grantsLength).fill(0).map((v, i) =>
                    <Col style={{marginBottom: '2em'}} span={6} key={i}>
                        <GrantCard key={i} mainnetProvider={mainnetProvider} grantId={i} provider={provider} chainId={chainId} userSigner={userSigner} />
                    </Col>

                )}
            </Row>
        </div>

    )

}

export default Grants;