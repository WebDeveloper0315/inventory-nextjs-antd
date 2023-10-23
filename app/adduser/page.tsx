'use client'
import PageTitle from '@/component/PageTitle'
import { SetLoading } from '@/redux/loadersSlice'
import { Button, Checkbox, Col, Form, Input, Row, Tooltip, message } from 'antd'
import axios from 'axios'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { InfoCircleOutlined, UserOutlined } from '@ant-design/icons'
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { CheckboxValueType } from 'antd/es/checkbox/Group'

function AddUser() {
    const {currentUser} = useSelector((state: any) => state.users)
    const dispatch = useDispatch()

    const onChange = (checkedValues: CheckboxValueType[]) => {
        console.log('checked = ', checkedValues);
    }

    const onFinish = async (values: any) => {
        try {
            dispatch(SetLoading(true))
            const response = await axios.post('/api/users/register', values)
            console.log(values)
            message.success('User Created Successfully. The user who you created can login for now.')
            
        } catch (error: any) {
            message.error(error.response.data.message || 'Something went wrong')
        } finally {
            dispatch(SetLoading(false))
        }

    }
  return (
    <div>
      <PageTitle title='Add User'/>
      <Form layout='vertical'
            onFinish={onFinish}
      >
            <div className="flex justify-center my-3">
                <Form.Item label="Name" name='name' className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                    <Input
                        placeholder="Enter your username"
                        suffix={
                            <Tooltip title="You can login with the name.">
                            <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                            </Tooltip>
                        }
                        />
                </Form.Item>
            </div>
            <div className="flex justify-center my-3">
                <Form.Item 
                    label="Password" 
                    name='password' 
                    className='lg:w-1/4 sm:w-1/2 md:w-1/3'
                    rules={[
                        { required: true, message: 'Please input your password!' },
                        // Add any other password validations here
                      ]}
                >
                    <Input.Password
                        placeholder="Input Password"
                        // iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                </Form.Item>
            </div>
            <div className="flex justify-center my-3">
                <Form.Item 
                    label="Confirm Password" 
                    name='confirmPassword' 
                    className='lg:w-1/4 sm:w-1/2 md:w-1/3'
                    dependencies={['password']}
                    rules={[
                        { required: true, message: 'Please confirm your password!' },
                        ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                            }
                            return Promise.reject('The two passwords do not match!');
                        },
                        }),
                    ]}
                >
                    <Input.Password
                        placeholder="Confirm Password"
                        // iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        
                    />
                </Form.Item>
            </div>
                <div className='flex justify-center my-3 mx-5'>
                    <Form.Item label="Select the user's authority" name='userAuthority' className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                        <Checkbox.Group style={{ width: '100%', display: 'grid' }} onChange={onChange}>
                            <Checkbox value='newProduct'>New Product</Checkbox>
                            <Checkbox value='sold'>Sold</Checkbox>
                            <Checkbox value='query'>Query</Checkbox>
                            <Checkbox value='addUser'>Add User</Checkbox>
                        </Checkbox.Group>
                    </Form.Item>
                </div>

        <div className="flex justify-center my-3">
            <Button type='primary' htmlType='submit' className='lg:w-1/4 sm:w-1/2 md:w-1/3'>
                Create
            </Button>
        </div>
      </Form>

    </div>
  )
}

export default AddUser
