import {parse, checkByOption} from 'ts-running'
import React from 'react';
import {Input, InputNumber, Button, Select, Switch, Tree, Form, Checkbox, Table, Space, Modal} from 'antd';
import {PlusOutlined, CloseCircleOutlined} from '@ant-design/icons';
import './App.css';
import 'antd/dist/antd.css';

const {useState} = React;
const {Option} = Select;
const {Column} = Table;

function getDefaultValue({type, value}) {
    if (type === 'number') {
        return 0
    } else if (type === 'array') {
        return []
    } else if (type === 'string') {
        return ''
    } else if (type === 'boolean') {
        return false
    } else if (type === 'tuple') {
        return value.map(item => {
            return getDefaultValue(item);
        })
    } else if (type === 'object') {
        const newObj = {};
        value.forEach(item => {
            newObj[item.key] = getDefaultValue(item.value);
        })
        return newObj;
    }
}

function Item({config, value, setValue, globleKey}) {
    let temp = null;
    if (config.type === '|') {
        for (let i = 0; i < config.value.length; i++) {
            if (checkByOption(config.value[i], value)) {
                temp = i;
                break;
            }
        }
    }
    const [orType, seOrType] = useState(temp);
    const [modalShow, setModalShow] = useState(false);
    const [modalSelectIndex, setModalSelectIndex] = useState(-1);
    const [modalSelectRecord, setModalSelectRecord] = useState(null);
    let attr = config.attr ? config.attr : {};

    function tempFunc() {
        if (config.type === 'number') {
            return <div>
                <InputNumber value={value} onChange={(value) => {
                    setValue(value)
                }} max={attr.max} min={attr.min} precision={attr.precision}/>
            </div>
        } else if (config.type === 'void') {
            return <div>{attr.text || '空'}</div>
        } else if (config.type === 'string') {
            return <div>
                <Input value={value} onChange={(e) => {
                    const {value} = e.target;
                    setValue(value)
                }} maxLength={attr.max}/>
            </div>
        } else if (config.type === 'boolean') {
            return <div>
                {
                    attr.type === 'checkbox' ?
                        <Checkbox checked={value} onChange={(e) => {
                            setValue(e.target.checked)
                        }}/> :
                        <Switch checked={value} onChange={(val) => {
                            setValue(val)
                        }}/>
                }
            </div>
        } else if (config.type === 'array') {
            if (attr.type === 'table' && config.value.type === 'object') {
                return <div style={{border: 'solid 1px #9e9e9e', padding: 10}}>
                    {
                        (!attr.max || value.length < attr.max) && <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            style={{margin: 5, float: 'right'}}
                            onClick={() => {
                                setValue([...value, getDefaultValue(config.value)])
                            }}
                        >{attr.addText || '添加'}</Button>
                    }
                    <Table dataSource={value}>
                        {
                            config.value.value.map(objectValue => {
                                return <Column
                                    title={(objectValue.attr && objectValue.attr.title) ? objectValue.attr.title : objectValue.key}
                                    dataIndex={objectValue.key}
                                    key={objectValue.key}
                                />
                            })
                        }
                        <Column
                            title="操作"
                            key="action"
                            width={180}
                            render={(text, record) => (
                                <Space size="middle">
                                    <Button onClick={() => {
                                        setModalShow(true);
                                        setModalSelectRecord(record)
                                        setModalSelectIndex(value.indexOf(record))
                                    }}>修改</Button>
                                    <Button onClick={() => {
                                        const newArr = [...value];
                                        newArr.splice(value.indexOf(record), 1)
                                        setValue(newArr)
                                    }}>删除</Button>
                                </Space>
                            )}
                        />
                    </Table>
                    <Modal
                        title="编辑"
                        visible={modalShow}
                        onOk={() => {
                            console.log(modalSelectRecord)
                            const newArr = [...value];
                            newArr[modalSelectIndex] = modalSelectRecord;
                            setValue(newArr)
                            setModalShow(false)
                        }}
                        onCancel={() => {
                            setModalShow(false)
                        }}
                    >
                        <Item config={config.value} value={modalSelectRecord} setValue={(val) => {
                            setModalSelectRecord(val);
                        }} globleKey={globleKey + '-' + config.value.type}/>
                    </Modal>
                </div>
            } else {
                return <div
                    className="array"
                    style={{display: attr.type === 'cardColumn' ? 'flex' : ''}}
                >
                    {value.map((item, key) => {
                        return <div
                            style={{
                                width: attr.cardWidth || 'auto',
                                height: attr.cardHeight || 'auto'
                            }}
                            className="card"
                            key={key}
                        >
                            <div style={{flex: 1}}>
                                <Item config={config.value} value={item} setValue={(val) => {
                                    const newArr = [...value]
                                    newArr[key] = val;
                                    setValue(newArr)
                                }} globleKey={globleKey + '-' + config.value.type}/>
                            </div>
                            <div className="close">
                                <CloseCircleOutlined
                                    onClick={() => {
                                        const newArr = [...value];
                                        newArr.splice(key, 1)
                                        setValue(newArr)
                                    }}/>
                            </div>
                        </div>
                    })}
                    {
                        (!attr.max || value.length < attr.max) && <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            style={{margin: 5}}
                            onClick={() => {
                                setValue([...value, getDefaultValue(config.value)])
                            }}
                        >{attr.addText || '添加'}</Button>
                    }
                </div>
            }
        } else if (config.type === '|') {
            return <div style={{display: 'flex'}}>
                <div>
                    <Select defaultValue={orType} onChange={(val) => {
                        seOrType(val)
                    }}>
                        {
                            config.value.map((item, key) => {
                                return <Option value={key}>{attr['name[' + key + ']'] || item.type}</Option>
                            })
                        }
                    </Select>
                </div>
                {
                    config.value[orType] && <div>
                        <Item config={config.value[orType]} value={value} setValue={(val) => {
                            setValue(val)
                        }}/>
                    </div>
                }
            </div>
        } else if (config.type === 'tuple') {
            const newArr = [...value]
            return <div style={{border: 'solid 1px grey', textAlign: 'left'}}>
                {
                    config.value.map((item, key) => {
                        return <div style={{margin: 5}}>
                            <Item config={item} value={value[key]} setValue={(val) => {
                                newArr[key] = val;
                                setValue(newArr)
                            }} globleKey={globleKey + '-' + key}/>
                        </div>
                    })
                }
            </div>
        } else if (config.type === 'object') {
            return <div>
                {
                    config.value.map(item => {
                        return <div>
                            <Item
                                config={{...item, attr: {...item.attr, ...attr}}}// 左右宽度设置在"对象"层级，需要传给objectValue对象
                                value={value[item.key]}
                                setValue={(val) => {
                                    setValue({...value, [item.key]: val})
                                }}
                                globleKey={globleKey + '-' + item.key}
                            />
                        </div>
                    })
                }
            </div>
        } else if (config.type === 'objectValue') {
            return <div className='ant-row ant-form-item' key={config.key}>
                <div className={'ant-col ant-col-' + (attr.left || 8) + ' ant-form-item-label'}>
                    <label className={config.mastNeed ? 'ant-form-item-required' : ''}>
                        {(config.attr && config.attr.title) ? config.attr.title : config.key}
                    </label>
                </div>
                <div className={'ant-col ant-col-' + (attr.right || 16) + ' ant-form-item-control'}>
                    <div className='ant-form-item-control-input'>
                        <div className="ant-form-item-control-input-content">
                            <Item
                                config={config.value}
                                value={value}
                                setValue={(val) => {
                                    setValue(val)
                                }}
                                globleKey={globleKey + '-' + config.value.type}
                            />
                        </div>
                    </div>
                </div>
            </div>
        } else {
            return <div>11{JSON.stringify(config, 2)}</div>
        }
    }

    return <div className={globleKey.replace(/^-/, '') === globleSelectedKeys ? 'selected' : ''}>{tempFunc()}</div>
}

let globleSelectedKeys = '';

function protypeInfoTree(config, beforeKey = '') {
    const key = beforeKey + (beforeKey !== '' ? '-' : '') + config.type;
    if (config.type === 'array') {
        return {
            key,
            title: '数组',
            children: [protypeInfoTree(config.value, key)]
        }
    } else if (['tuple', '|'].includes(config.type)) {
        return {
            key,
            title: {tuple: '元组', '|': '或'}[config.type],
            children: config.value.map((item, keyIn) => {
                return protypeInfoTree(item, key + '-' + keyIn)
            })
        }
    } else if (['object'].includes(config.type)) {
        return {
            key,
            title: '对象',
            children: config.value.map(item => {
                return {
                    key: key + '-' + item.key,
                    title: (item.attr && item.attr.title) ? (item.attr.title + '（' + item.key + '）') : item.key,
                    children: [protypeInfoTree(item.value, key + '-' + item.key)]
                }
            })
        }
    } else if (['boolean', 'string', 'number', 'void'].includes(config.type)) {
        return {
            key: key,
            title: {boolean: '布尔', string: '字符串', number: '数字', void: '空'}[config.type],
        }
    }
    return {
        title: ''
    }
}

function App() {
    // const parseConfig = parse('number');
    const parseConfig = [
        // 'number', 3
        // 'number[]', []
        // 'boolean[]', [false, true]
        // 'number[][]', []
        // 'string[]', []
        // 'void', null
        // 'number|string', 1
        // 'number|string|boolean', 1
        // 'Array<number>', [2]
        // 'Array<number|string>', [1, 'hello']
        // '[string,number]', ['hello', 22]
        // '[string,number][]', []
        // '{label:string}', {label: '1'}
        // '{label:string,count?:number}', {label: 'hello', count: 1}
        // '{label?:string}', {}
        '{label:string}[]', [{label: 'asd'}, {label: '222'}]
        // '{label?:string}[]', [{label: 'asd'}, {}]
        // '{label:string|number}', {label: 1}
        // '{articles:{deep:{deep2:{deep3:number}},label:string|number}[]}', {
        //     articles: [{
        //         deep: {deep2: {deep3: 1}},
        //         label: ''
        //     }]
        // }
    ];
    const [value, setValue] = useState(parseConfig[1])
    const [config, setConfig] = useState(parse(parseConfig[0]))
    const [tsStr, setTsStr] = useState(parseConfig[0])
    const [selectType, setSelectType] = useState('')
    const [selectTypeAttr, setSelectTypeAttr] = useState(null)
    const [selectedKeys, setSelectedKeys] = useState([])

    function typeProtypeProtype(selectConfig, attr) {
        let inner = null;
        const {type} = selectConfig;
        if (type === 'array') {
            inner = [
                <Form.Item label="显示方式" name="type">
                    <Select>
                        <Option value='cardRow'>纵向排列卡片</Option>
                        <Option value='cardColumn'>横向排列卡片</Option>
                        <Option value='table'>表格</Option>
                    </Select>
                </Form.Item>,
                <Form.Item label="最多数量" name="max">
                    <InputNumber/>
                </Form.Item>,
                <Form.Item label="卡片宽度" name="cardWidth">
                    <InputNumber/>
                </Form.Item>,
                <Form.Item label="卡片高度" name="cardHeight">
                    <InputNumber/>
                </Form.Item>,
                <Form.Item label="添加按钮文案" name="addText">
                    <Input/>
                </Form.Item>
            ]
        } else if (type === 'number') {
            inner = [
                <Form.Item label="最大值" name="max">
                    <InputNumber/>
                </Form.Item>,
                <Form.Item label="最小值" name="min">
                    <InputNumber/>
                </Form.Item>,
                <Form.Item label="精度" name="precision">
                    <InputNumber/>
                </Form.Item>
            ]
        } else if (type === 'string') {
            inner = [
                <Form.Item label="最大长度" name="max">
                    <InputNumber/>
                </Form.Item>
            ]
        } else if (type === 'boolean') {
            inner = [
                <Form.Item label="显示方式" name="type">
                    <Select>
                        <Option value='switch'>开关</Option>
                        <Option value='checkbox'>勾选</Option>
                    </Select>
                </Form.Item>
            ]
        } else if (type === 'void') {
            inner = [
                <Form.Item label="文案" name="text">
                    <Input/>
                </Form.Item>
            ]
        } else if (type === 'objectValue') {
            inner = [
                <Form.Item label="名称" name="title">
                    <Input/>
                </Form.Item>
            ]
        } else if (type === '|') {
            inner = [
                <Form.Item label="显示方式" name="text">
                    <Select>
                        <Option value='select'>下拉切换</Option>
                        <Option value='checkbox'>勾选</Option>
                    </Select>
                </Form.Item>,
                ...selectConfig.value.map((item, key) => {
                    return <Form.Item label={"名称" + (key + 1)} name={"name[" + key + "]"}>
                        <Input/>
                    </Form.Item>
                })
            ]
        } else if (type === 'object') {
            inner = [
                <Form.Item label="左侧宽度（总24）" name="left">
                    <InputNumber/>
                </Form.Item>,
                <Form.Item label="右侧宽度（总24）" name="right">
                    <InputNumber/>
                </Form.Item>
            ]
        } else {
            inner = []
        }
        return <div>
            <Form
                key={JSON.stringify(selectedKeys)}
                initialValues={attr}
                onFinish={(values) => {
                    let newConfig = JSON.parse(JSON.stringify(config));
                    let temp = newConfig;
                    selectedKeys.forEach(key => {
                        if (temp.type === 'array') {
                            temp = temp.value;
                        } else if (temp.type === 'object') {
                            temp = temp.value.find(item => item.key === key);
                        } else if (temp.type === 'objectValue') {
                            temp = temp.value;
                        } else if (temp.type === '|') {
                            temp = temp.value[parseInt(key)];
                        } else {
                            console.error('其他类型路径')
                        }
                    })
                    temp.attr = values;
                    setConfig(newConfig);
                }}>
                {inner}
                {
                    inner.length > 0 ? <Form.Item>
                        <Button type="primary" htmlType="submit">应用</Button>
                    </Form.Item> : <div>暂无配置</div>
                }
            </Form>
        </div>
    }

    return (
        <div className="App" style={{display: 'flex'}}>
            <div style={{flex: 1, margin: 30}}>
                <div style={{display: 'flex', marginBottom: 30}}>
                    <Input addonBefore='TS语法' defaultValue={tsStr} onChange={(val) => {
                        setTsStr(val.target.value)
                    }} type={'warning'}/>
                    <Button type="primary" style={{marginLeft: 6}} onClick={() => {
                        try {
                            const config = parse(tsStr)
                            setValue(getDefaultValue(config));
                            setConfig(config)
                        } catch (e) {

                        }
                    }}>生成</Button>
                </div>
                <div style={{border: 'solid 1px black', padding: 10}}>
                    <Item
                        config={config}
                        value={value}
                        setValue={(val) => {
                            setValue(val)
                        }}
                        globleKey={config.type}
                    />
                </div>
                <div style={{border: 'solid 1px black', marginTop: 30}}>
                    <div>表单生成值</div>
                    <div>{JSON.stringify(value, 2)}</div>
                </div>
            </div>
            <div style={{width: 300, borderLeft: 'solid 1px black', marginLeft: 30, padding: 10}}>
                属性值
                <Tree
                    showLine={true}
                    defaultExpandAll
                    treeData={[protypeInfoTree(config)]}
                    onSelect={(selectedKeys) => {
                        if (selectedKeys.length > 0) {
                            const keyList = selectedKeys[0].split('-').slice(1);
                            setSelectedKeys(selectedKeys[0].split('-').slice(1));
                            globleSelectedKeys = selectedKeys[0];
                            let temp = config;
                            for (let i = 0; i < keyList.length; i++) {
                                const key = keyList[i];
                                if (temp.type === 'array') {
                                    temp = temp.value;
                                } else if (temp.type === 'object') {
                                    temp = temp.value.find(item => item.key === key);
                                } else if (temp.type === 'objectValue') {
                                    temp = temp.value;
                                } else if (temp.type === '|') {
                                    temp = temp.value[parseInt(key)];
                                } else {
                                    console.log(key, temp);
                                    console.error('其他类型路径')
                                }
                            }
                            setSelectType(temp);
                            setSelectTypeAttr(temp.attr);
                        } else {
                            globleSelectedKeys = '';
                            setSelectType({type: ''});
                            setSelectTypeAttr(null);
                        }
                    }}
                />
                <div style={{borderBottom: 'solid 1px #9e9e9e', marginBottom: 30, marginTop: 20}}></div>
                <div>
                    {typeProtypeProtype(selectType, selectTypeAttr)}
                </div>
            </div>
        </div>
    );
}

export default App;
