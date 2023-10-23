'use client'
import React from 'react'
import store from '@/redux/store'
import {Provider} from 'react-redux'

function ReduxProvider({children} : any) {
    return (
        <Provider store={store}>
            {children}
        </Provider>
    )
}

export default ReduxProvider