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


const renderStatus = (status) => {
    /*
     INITIATED,
        TO_BE_JUDGED,
        FINALIZED,
        NEED_EDIT,
        NEED_TRIAGE
    } */
    switch (status) {
        case 0:
            return "Initiated"
        case 1:
            return "To Be Judged"
        case 2:
            return "Finalized"
        case 3:
            return "Need Edit"
        case 4:
            return "Need Triage"
    }
}

const renderResult = (status) => {
    /*
      PASS,
        FAIL,
        TRIAGE,
        MODS
    */
    switch (status) {
        case 0:
            return "Pass"
        case 1:
            return "Failed"
        case 2:
            return "Sent To Triage"
        case 3:
            return "Waiting For Modification"
    }
}

//
const GrantEditor = ({ tx, userSigner, provider, chainId, grantData, grantContract, refetch, setIsEditing }) => {
    const [bannerImage, setBannerImage] = useState("")
    const [image, setImage] = useState("")

    const [form] = Form.useForm();


    const history = useHistory()

    const formItemLayout = {
        labelCol: { span: 4 },
        wrapperCol: { span: 16 },
    };

    const buttonItemLayout = {
        wrapperCol: { span: 14, offset: 4 },
    };

    const defaultKeywords = ["defi", "utility", "infrastructure", "dex", "tooling"].map(item => (
        <Option key={item}>{item}</Option>
    ));

    function handleChange(value) {
        console.log(`selected ${value}`);
    }

    const normFile = e => {
        console.log("Upload event:", e);

        if (Array.isArray(e)) {
            return e;
        }

        return e && e.fileList;
    };


    return (
        <div className="card-container">
            <Card title={`Edit Contract`}>
                <Form
                    onFinish={({ name, description, category,
                        projectWebsite, projectGithub,
                        twitterHandle, keywords }) => {
                        // TODO need to add validation

                        const metadata = {
                            name,
                            description,
                            category,
                            image: image ? image.path : "",
                            properties: {
                                projectWebsite,
                                projectGithub,
                                twitterHandle,
                                keywords,
                                bannerImage: bannerImage ? bannerImage.path : ""
                            }
                        }


                        ipfs.add(JSON.stringify(metadata))
                            .then(r => {
                                tx(grantContract.connect(userSigner).edit(r.path)).then((grantId) => {
                                    console.log(grantId)
                                    refetch()
                                    setIsEditing(false)
                                }).catch(err => {
                                    console.log(err)
                                })
                            })
                            .catch(err => console.log(err))

                    }}
                    onFinishFailed={(errorInfo) => {
                        console.log("Failed:", errorInfo);
                    }}
                    form={form}
                    layout="horizental"
                    requiredMark="required"
                    {...formItemLayout}
                >
                    <Form.Item
                        label="Name"
                        required
                        tooltip={{
                            title: "Put an eye catching name for your grant.",
                            icon: <InfoCircleOutlined />,
                        }}
                        name="name"
                    >
                        <Input placeholder="EG. Make ETH Better" />
                    </Form.Item>
                    <Form.Item
                        label="Description."
                        tooltip={{
                            title: "Describe your grant.",
                            icon: <InfoCircleOutlined />,
                        }}
                        name="description"
                    >
                        <Input.TextArea placeholder="EG. We are building tools to make Ethereum better" />
                    </Form.Item>
                    <Form.Item
                        required
                        style={{ textAlign: 'left' }}
                        label="Category."
                        tooltip={{
                            title: "Select the most appropiate category.",
                            icon: <InfoCircleOutlined />,
                        }}
                        name="category"
                    >
                        <Select
                            showSearch
                            placeholder="Select a category for your grant"
                            optionFilterProp="children"
                            name="Category"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            <Option value="dappTech">dApp Tech</Option>
                            <Option value="infra">Infra Tech</Option>
                            <Option value="nft">NFTs</Option>
                            <Option value="dgov">dGov</Option>
                            <Option value="community">Cummunity</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'left' }} name="image" label="Image" valuePropName="fileList" getValueFromEvent={normFile}>
                        <Upload
                            name="formImage"
                            customRequest={({ file, onSuccess, onError }) => {
                                return ipfs.add(file)
                                    .then(r => {
                                        console.log(r)
                                        onSuccess('Image Uploaded')
                                        setImage(r)
                                    })
                                    .catch(err => {
                                        console.log(err)
                                        onError('Something bad happened :(')
                                    })
                            }}

                            listType="picture"
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Click to upload</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        label="Repository"
                        name="projectGithub"
                        tooltip={{
                            title: "Project opensource repository",
                            icon: <InfoCircleOutlined />,
                        }}
                        required
                    >
                        <Input
                            placeholder="EG. https://github.io/meb/project" />
                    </Form.Item>
                    <Form.Item
                        label="Website"
                        name="projectWebsite"
                        tooltip={{
                            title: "Project Website",
                            icon: <InfoCircleOutlined />,
                        }}
                    >
                        <Input placeholder="EG. http://www.makeethbetter.com" />
                    </Form.Item>

                    <Form.Item
                        required
                        label="Twitter"
                        name="twitterHandle"
                        tooltip={{
                            title: "What's project twitter? People can trust you more this way.",
                            icon: <InfoCircleOutlined />,
                        }}
                    >
                        <Input placeholder="EG. http://www.makeethbetter.com" />
                    </Form.Item>
                    <Form.Item
                        name="keywords"
                        label="Keywords"
                        tooltip={{
                            title: "Add some keyword. Help people to know you better.",
                            icon: <InfoCircleOutlined />,
                        }}
                    >
                        <Select
                            mode="tags"
                            style={{ textAlign: "left" }}
                            placeholder="Eg. Defi, Social Wallet, ..."
                            onChange={handleChange}
                        >
                            {defaultKeywords}
                        </Select>
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'left' }} name="banner" label="Banner" valuePropName="fileList" getValueFromEvent={normFile}>
                        <Upload

                            name="banner"
                            customRequest={({ file, onSuccess, onError }) => {
                                return ipfs.add(file)
                                    .then(r => {
                                        console.log(r)
                                        onSuccess('Image Uploaded')
                                        setBannerImage(r)
                                    })
                                    .catch(err => {
                                        console.log(err)
                                        onError('Something bad happened :(')
                                    })
                            }}

                            listType="picture"
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Edit Grant</Button>
                        </Upload>
                    </Form.Item>
                    <Divider />
                    <Row>
                        <Col offset={20} span={4}>
                            <Button type="primary" htmlType="submit" onClick={() => {
                                console.log(form)
                            }}>Edit Grant</Button>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </div>
    );
};


const GrantCard = ({ data, basics, mainnetProvider }) => {
    if (!data || !basics) return (
        <div>Loading ...</div>
    )
    return (
        <div style={{ padding: '2em' }}>
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

const GrantActions = ({
    data, basics, refetch, provider, chainId, tx,
    userSigner, grantAddress, grantContract,
    setAddReview, setIsEditing, setTriage
}) => {
    const [contractBalance, setContractBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [evC, setEC] = useState(0)

    const contracts = useContractLoader(provider, { chainId });
    let contract;
    contract = contracts ? contracts["GTC"] : "";

    const contractAddress = contract ? contract.address : "";
    const contractIsDeployed = useContractExistsAtAddress(provider, contractAddress);

    const grefetch = () => setEC(evC + 1);

    useEffect(async () => {
        if (contract) {
            setContractBalance(await contract.balanceOf(grantAddress))
            setLoading(false)
        }
    }, [contract, evC])

    if (!contractIsDeployed) {
        return (<div>GTC is not deployed</div>)
    }


    if (!data || !basics || loading) return (
        <div>Loading ...</div>
    )


    console.log(basics.result)

    const renderProperAction = () => {
        switch (basics.status) {
            case 0:
                return <div>             <Divider />
                    <Button onClick={async () => {
                        // Pay the needed Bounty
                        await tx(contract.connect(userSigner).transfer(grantAddress, basics.bountyAmount))
                        grefetch()
                        // Make it judgeable
                        await tx(grantContract.makeJudgeable())
                        // refetch states
                        refetch()
                    }}
                        type="primary"
                    >Make It Judgeable</Button>
                </div>
            case 1:
                return <div>
                    <Divider />

                    <div style={{ marginBottom: '1em' }}>
                        <Button onClick={() => { setAddReview(true) }}>Add A Review</Button>
                    </div>
                    <div>
                        <Button disabled={basics.currentVotesCounts < 3} type="primary" onClick={async () => {
                            await tx(grantContract.finalizeResult())
                            refetch()
                        }}>Finalize Result</Button>
                    </div>
                </div>
            case 2:
                return <div>
                    <Divider />

                    <div style={{ marginBottom: '1em' }}>
                        <Button type="primary" onClick={async () => {
                            await tx(grantContract.takeBounty())
                            refetch()
                            grefetch()
                        }}>Take Your Bounty</Button>
                    </div>
                </div>
            case 3:
                if (userSigner.address !== basics.owner) return null
                return <div>
                    <Divider />

                    <div style={{ marginBottom: '1em' }}>
                        <Button type="primary" onClick={async () => {
                            // await tx(grantContract.takeBounty())
                            setIsEditing(true)
                            //refetch()
                            //grefetch()
                        }}>Edit Grant</Button>
                    </div>
                </div>
            case 4:
                return <div>
                    <Divider />
                    <div style={{ marginBottom: '1em' }}>
                        <Button type="primary" onClick={async () => {
                            // await tx(grantContract.takeBounty())
                            setTriage(true)
                            //refetch()
                            //grefetch()
                        }}>Triage</Button>
                    </div>
                </div>
        }
    }


    return (
        <div style={{ padding: '2em' }}>
            <Card title={`Status: ${renderStatus(basics.status)} - Version: ${Number(String(basics.version)) + 1}`}>
                {(!!basics.result || basics.result === 0) && (basics.status !== 0 && basics.status !== 1) && <>
                    <div style={{ marginBottom: '1em', display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 15 }} type="secondary" >Result</Text>
                        <Text style={{ fontSize: 15 }} >{renderResult(basics.result)}</Text>

                    </div>
                    <div style={{ marginBottom: '1em', display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 15 }} type="secondary" >Confidence</Text>
                        <Text style={{ fontSize: 15 }} >{String(basics.confidence)}</Text>
                    </div>
                    <Divider />
                </>}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: '1em' }} >
                    <Text type="secondary">Total Bounty Amount (GTC):</Text>
                    <Text >{String(basics.bountyAmount)}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: '1em' }}>
                    <Text type="secondary">Contract Balance (GTC):</Text>
                    <Text >{String(contractBalance)}</Text>
                </div>
                {renderProperAction()}
            </Card>
        </div >
    )
}

const ReviewButton = ({ selected, children, ...rest }) => {
    return <Button type={selected ? "primary" : "link"} {...rest} style={{ marginRight: '1em' }}>
        {children}
    </Button>
}

const AddReviewForm = ({
    grantContract,
    setAddReview, tx, refetch,
    provider, chainId,
    isTriage, setTriage,
    grantAddress
}) => {
    const [contentStatus, setContentStatus] = useState(null)
    const [contentComment, setContentComment] = useState()
    const [categoryStatus, setCategoryStatus] = useState(null)
    const [categoryComment, setCategoryComment] = useState()
    const [legitStatus, setLegitStatus] = useState(null)
    const [legitComment, setLegitComment] = useState()

    const contracts = useContractLoader(provider, { chainId });
    const triageContract = contracts ? contracts["TriageGroup"] : "";




    const isSubmittable = () => {
        const isNull = a => a === null

        if (isNull(contentStatus) || isNull(categoryStatus) || isNull(legitStatus)) return false

        if (contentStatus == 3 && !contentComment) return false
        if (categoryStatus == 3 && !setCategoryStatus) return false
        if (legitStatus == 3 && !setLegitStatus) return false
        return true
    }

    return (
        <div style={{ padding: '2em' }}>
            <Card title={isTriage ? "Triage The Grant" : "Add A Review"} style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '1em' }}>
                    <Text style={{ fontSize: 18 }}>
                        Does this grant's content meet our requirements?
                    </Text>
                </div>
                <div >
                    <ReviewButton onClick={() => setContentStatus(0)} selected={contentStatus === 0}>Yes</ReviewButton>
                    <ReviewButton onClick={() => {
                        if (contentStatus !== 1 || contentStatus !== 3) {
                            setContentStatus(1)
                        }
                    }} selected={contentStatus === 1 || contentStatus === 3}>No</ReviewButton>
                    <ReviewButton onClick={() => setContentStatus(2)} selected={contentStatus === 2}>Unsure</ReviewButton>
                </div>
                {(contentStatus === 1 || contentStatus === 3) && <div style={{ marginTop: '1em' }}>
                    <Checkbox checked={contentStatus === 3} onChange={() => {
                        if (contentStatus === 1) {
                            setContentStatus(3)
                        } else {
                            setContentStatus(1)
                        }
                    }}>Does the content need modification</Checkbox>
                </div>}
                {contentStatus === 3 && <div style={{ marginTop: '1em', marginBottom: '1em' }}>
                    <Input.TextArea placeholder="Explain the needed modfications" value={contentComment} onChange={e => setContentComment(e.target.value)} ></Input.TextArea>
                </div>}

                <Divider />
                <div style={{ marginBottom: '1em' }}>
                    <Text style={{ fontSize: 18 }}>
                        Does this grant's category meet our requirements?
                    </Text>
                </div>
                <div >
                    <ReviewButton onClick={() => setCategoryStatus(0)} selected={categoryStatus === 0}>Yes</ReviewButton>
                    <ReviewButton onClick={() => {
                        if (categoryStatus !== 1 || categoryStatus !== 3) {
                            setCategoryStatus(1)
                        }
                    }} selected={categoryStatus === 1 || categoryStatus === 3}>No</ReviewButton>
                    <ReviewButton onClick={() => setCategoryStatus(2)} selected={categoryStatus === 2}>Unsure</ReviewButton>
                </div>
                {(categoryStatus === 1 || categoryStatus === 3) && <div style={{ marginTop: '1em' }}>
                    <Checkbox checked={categoryStatus === 3} onChange={() => {
                        if (categoryStatus === 1) {
                            setCategoryStatus(3)
                        } else {
                            setCategoryStatus(1)
                        }
                    }}>Does the category need modification</Checkbox>
                </div>}
                {categoryStatus === 3 && <div style={{ marginTop: '1em', marginBottom: '1em' }}>
                    <Input.TextArea placeholder="Explain the needed modfications" value={categoryComment} onChange={e => setCategoryComment(e.target.value)} ></Input.TextArea>
                </div>}

                <Divider />
                <div style={{ marginBottom: '1em' }}>
                    <Text style={{ fontSize: 18 }}>
                        Is this grant legit?
                    </Text>
                </div>
                <div >
                    <ReviewButton onClick={() => setLegitStatus(0)} selected={legitStatus === 0}>Yes</ReviewButton>
                    <ReviewButton onClick={() => {
                        if (legitStatus !== 1 || legitStatus !== 3) {
                            setLegitStatus(1)
                        }
                    }} selected={legitStatus === 1 || legitStatus === 3}>No</ReviewButton>
                    <ReviewButton onClick={() => setLegitStatus(2)} selected={legitStatus === 2}>Unsure</ReviewButton>
                </div>
                {(legitStatus === 1 || legitStatus === 3) && <div style={{ marginTop: '1em' }}>
                    <Checkbox checked={legitStatus === 3} onChange={() => {
                        if (legitStatus === 1) {
                            setLegitStatus(3)
                        } else {
                            setLegitStatus(1)
                        }
                    }}>Does the legitimacy need modification</Checkbox>
                </div>}
                {legitStatus === 3 && <div style={{ marginTop: '1em', marginBottom: '1em' }}>
                    <Input.TextArea placeholder="Explain the needed modfications" value={legitComment} onChange={e => setLegitComment(e.target.value)} ></Input.TextArea>
                </div>}

                <Divider />

                <div onClick={async () => {
                    const renderResult = (result) => {
                        switch (result) {
                            case 0:
                                return 'pass'
                            case 1:
                                return 'fail'
                            case 2:
                                return 'triage'
                            case 3:
                                return 'mods'
                        }
                    }
                    const review = {
                        content: {
                            result: renderResult(contentStatus),
                        },
                        category: {
                            result: renderResult(categoryStatus)
                        },
                        legit: {
                            result: renderResult(legitStatus)
                        }
                    }
                    if (contentComment) {
                        review.content["comment"] = contentComment
                    } if (categoryComment) {
                        review.category["comment"] = categoryComment
                    } if (legitComment) {
                        review.content["legit"] = legitComment
                    }

                    // Upload comment to ipfs
                    const commentHash = await ipfs.add(JSON.stringify(review))


                    console.log(commentHash)
                    // Then create a new tx
                    if(isTriage) {
                        await tx(triageContract.reviewGrant(grantAddress, commentHash, contentStatus, categoryStatus, legitStatus))
                        setTriage(false)
                    } else {
                        await tx(grantContract.addPeerReview(commentHash, contentStatus, categoryStatus, legitStatus))
                        setAddReview(false)
                    }

                    refetch()

                }} style={{ textAlign: 'center' }}>
                    <Button disabled={!isSubmittable()} type="primary">Submit Review</Button>
                </div>
            </Card>

        </div>
    )
}

const GrantDetails = ({
    userSigner, provider, chainId, mainnetProvider, tx
}) => {
    const [loading, setLoading] = useState(true)
    const [grantAddress, setGrantAddress] = useState("")
    const [grantBasicStates, setGrantBasicStates] = useState()
    const [grantContract, setGrantContract] = useState(null)
    const [grantData, setGrantData] = useState()
    const [eventCount, setEC] = useState(0)
    const [isAddingReview, setIsAddingReview] = useState(false)
    const [isTriage, setTriage] = useState(false)
    const [isEditingGrant, setIsEditingGrant] = useState(false)

    const contracts = useContractLoader(provider, { chainId });
    let contract;
    contract = contracts ? contracts["GrantManager"] : "";

    const contractAddress = contract ? contract.address : "";
    const contractIsDeployed = useContractExistsAtAddress(provider, contractAddress);

    const refetch = () => {
        setEC(eventCount + 1)
    }

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

    }, [grantAddress, eventCount])

    const { grantId } = useParams()



    if (!contractIsDeployed) return (
        <div>
            Contract is not deployed
        </div>
    )

    if (loading) return (
        <div>Loading ...</div>
    )

    if (!grantAddress) return (
        <div>404! Not found any grant with this ID!</div>
    )

    return (
        <Row>
            <Col span={6}>
                <GrantCard basics={grantBasicStates} data={grantData} mainnetProvider={mainnetProvider} />
            </Col>
            <Col span={6}>
                <GrantActions setTriage={setTriage} setAddReview={setIsAddingReview} setIsEditing={setIsEditingGrant} grantContract={grantContract} grantAddress={grantAddress} userSigner={userSigner} tx={tx} provider={provider} chainId={chainId} refetch={refetch} basics={grantBasicStates} data={grantData} mainnetProvider={mainnetProvider} />
            </Col>
            <Col span={12}>
                {isAddingReview && <AddReviewForm setAddReview={setIsAddingReview} grantContract={grantContract} tx={tx} refetch={refetch} />}
                {isEditingGrant && <GrantEditor userSigner={userSigner} basics={grantBasicStates} grantData={grantData} setIsEditing={setIsEditingGrant} grantContract={grantContract} tx={tx} refetch={refetch} provider={provider} chainId={chainId} />}
                {isTriage && <AddReviewForm isTriage={isTriage} setTriage={setTriage} userSigner={userSigner} basics={grantBasicStates} grantAddress={grantAddress}  grantData={grantData} setIsEditing={setIsEditingGrant} grantContract={grantContract} tx={tx} refetch={refetch} provider={provider} chainId={chainId} />}
            </Col>
        </Row>
    )
}

export default GrantDetails