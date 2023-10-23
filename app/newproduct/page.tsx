import PageTitle from '@/component/PageTitle'
import { Button, Col, Row } from 'antd'
import Link from 'next/link'
import React from 'react'

function NewProduct() {
  return (
    <div>
      <PageTitle title='New Product'/>
      <div className='my-3'>
        <Row gutter={[16, 16]}>
          <Col span={4}>

          </Col>
          <Col span={8}>
            <Button type='primary' block>
              <i className="ri-add-line">&nbsp;Units</i>
            </Button>       
          </Col>
          <Col span={8}>
            <Link href="/newproduct/new">
              <Button type='primary' block>
                <i className="ri-file-list-3-line">&nbsp;New</i>
              </Button>  
            </Link>     
          </Col>
        </Row>
      </div>
      
    </div>
  )
}

export default NewProduct
