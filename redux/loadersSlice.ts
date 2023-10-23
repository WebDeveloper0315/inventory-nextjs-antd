import {createSlice} from "@reduxjs/toolkit"

const loadersSlice = createSlice({
    name: "loaders",
    initialState: {
        loading: false,
    },
    reducers: {
        SetLoading : (state, action) => {
            state.loading = action.payload
        }
    }
})

export const { SetLoading } = loadersSlice.actions
export default loadersSlice.reducer