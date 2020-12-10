import {parse, checkByOption} from 'ts-running'
import React from 'react';
import {Input, InputNumber, Button, Select, Switch, Tree} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import './App.css';
import 'antd/dist/antd.css';

const {useState} = React;
const {Option} = Select;

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

function Item({config, value, setValue}) {
    let temp = null;
    if (config.type === '|') {
        for (let i = 0; i < config.value.length; i++) {
            if (checkByOption(config.value[i], value)) {
                temp = i;
                break;
            }
        }
    }
    const [orType, seOrType] = useState(temp)
    if (config.type === 'number') {
        return <div>
            <InputNumber defaultValue={value} onChange={(value) => {
                setValue(value)
            }}/>
        </div>
    } else if (config.type === 'void') {
        return <div>空</div>
    } else if (config.type === 'string') {
        return <div>
            <Input defaultValue={value} onChange={(e) => {
                const {value} = e.target;
                setValue(value)
            }}/>
        </div>
    } else if (config.type === 'boolean') {
        return <div>
            <Switch defaultChecked={value} onChange={(val) => {
                setValue(val)
            }}/>
        </div>
    } else if (config.type === 'array') {
        return <div style={{border: 'solid 1px grey', textAlign: 'left'}}>
            {value.map((item, key) => {
                return <div style={{margin: 5}} key={key}>
                    <Item config={config.value} value={item} setValue={(val) => {
                        const newArr = [...value]
                        newArr[key] = val;
                        setValue(newArr)
                    }}/>
                </div>
            })}
            <Button
                type="primary"
                icon={<PlusOutlined/>}
                style={{margin: 5}}
                onClick={() => {
                    setValue([...value, getDefaultValue(config.value)])
                }}
            >添加</Button>
        </div>
    } else if (config.type === '|') {
        return <div style={{display: 'flex'}}>
            <Select defaultValue={orType} style={{width: 120}} onChange={(val) => {
                seOrType(val)
            }}>
                {
                    config.value.map((item, key) => {
                        return <Option value={key}>{item.type}</Option>
                    })
                }
            </Select>
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
                        }}/>
                    </div>
                })
            }
        </div>
    } else if (config.type === 'object') {
        return <div style={{border: 'solid 1px grey', paddingTop: 5}}>
            {
                config.value.map(item => {
                    return <div className='ant-row ant-form-item' key={item.key}>
                        <div className='ant-col ant-col-8 ant-form-item-label'>
                            <label className={item.mastNeed ? 'ant-form-item-required' : ''}>
                                {item.key}
                            </label>
                        </div>
                        <div className='ant-col ant-col-16 ant-form-item-control'>
                            <div className='ant-form-item-control-input'>
                                <Item config={item.value} value={value[item.key]} setValue={(val) => {
                                    setValue({...value, [item.key]: val})
                                }}/>
                            </div>
                        </div>
                    </div>
                })
            }
        </div>
    } else {
        return <div>11{JSON.stringify(config, 2)}</div>
    }
}

function protopeInfoTree(config, key) {
    console.log(config.type)
    console.log(config)
    if (config.type === 'array') {
        return {
            title: '数组',
            children: [protopeInfoTree(config.value)]
        }
    } else if (['tuple', '|'].includes(config.type)) {
        return {
            title: {tuple: '元组', '|': '或'}[config.type],
            children: config.value.map(item => {
                return protopeInfoTree(item)
            })
        }
    } else if (['object'].includes(config.type)) {
        return {
            title: '对象',
            children: config.value.map(item => {
                return {
                    title: item.key,
                    children: [protopeInfoTree(item.value)]
                }
            })
        }
    } else if (['boolean', 'string', 'number', 'void'].includes(config.type)) {
        return {
            title: key ? key : {boolean: '布尔', string: '字符串', number: '数字', void: '空'}[config.type],
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
        'number[]', []
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
        // '{label:string}[]', [{label: 'asd'}, {label: '222'}]
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
                            console.log(config)
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
                    treeData={[protopeInfoTree(config)]}
                />
            </div>
        </div>
    );
}

export default App;
