import { useState } from "react";
import { Form, Input, Button, Radio, Card, Row, Col, Upload, Divider } from "antd";
import { InfoCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { useContractExistsAtAddress, useContractLoader } from "../hooks";
import {useHistory} from 'react-router-dom'

const ipfsAPI = require("ipfs-http-client");
const chalk = require("chalk");
//
const { globSource } = ipfsAPI;

const infura = { host: "ipfs.infura.io", port: "5001", protocol: "https" };
//// run your own ipfs daemon: https://docs.ipfs.io/how-to/command-line-quick-start/#install-ipfs
//const localhost = { host: "localhost", port: "5001", protocol: "http" };
//
const ipfs = ipfsAPI(infura);

const ipfsGateway = "https://ipfs.io/ipfs/";
const ipnsGateway = "https://ipfs.io/ipns/";



console.log(ipfs);
//
/**
 * 
 * @returns 
 * 
 * 
 * “metadata”: {
        “name”: “Make ETH Better”, ---TICK
        “description”: “We are building tools to make Ethereum better”, ---TICK
        “image”: “https://my.image.com/image.jpg”, ---TICK
        "category": 
        “properties”: {
          “projectWebsite”: “https://makeethbetter.com”, ---TICK
          “projectGithub”: “https://github.io/meb/project”, ---TICK
          “bannerImage”: “https://my.image.com/banner.jpg”, ---TICK
          "twitterHandle": "makeethbetterer", ---TICK
          "keywords": [ "infrastructure", “ethereum” ], 
          "endDate": "2017 Mar 03 05:12:41.211 PDT",
        }

 */

//
const GrantCreator = ({ tx, userSigner, provider, chainId }) => {
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

    const currentStep = 'Upload Metadata'

    const contracts = useContractLoader(provider, { chainId });
    let contract;
    contract = contracts ? contracts["GrantManager"] : "";


    console.log(contract)
    
    const contractAddress = contract ? contract.address : "";
    const contractIsDeployed = useContractExistsAtAddress(provider, contractAddress);


    if (!contractIsDeployed) return (
        <div>
            Contract is not deployed
        </div>
    )

    return (
        <div className="card-container">
            <Card title={`Create A Grant`}>
                <Form
                    onFinish={({ name, description, category,
                        projectWebsite, projectGithub,
                        twitterHandle, keywords }) => {
                        // TODO need to add validation
                        console.log(image.path)

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
                                contract.on('GrantCreated', (hash, id) => {
                                    if(hash === r.path) {
                                        history.push(`/grant/${id}`)
                                    }
                                })
                                console.log(r.path)
                                tx(contract.connect(userSigner).createGrant(r.path)).then((grantId) => {
                                    console.log(grantId)
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
                    <Row>
                        <Col span={12}>
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

                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Repository"
                                name="projectGithub"
                                tooltip={{
                                    title: "Project opensource repository",
                                    icon: <InfoCircleOutlined />,
                                }}
                                required
                            >
                                <Input placeholder="EG. https://github.io/meb/project" />
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
                                    <Button icon={<UploadOutlined />}>Click to upload</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider />
                    <Row>
                        <Col offset={20} span={4}>
                            <Button type="primary" htmlType="submit" onClick={() => {
                                console.log(form)
                            }}>Create Grant</Button>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </div>
    );
};

export default GrantCreator;
