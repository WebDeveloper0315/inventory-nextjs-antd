import {createSlice} from "@reduxjs/toolkit"

const usersSlice = createSlice({
    name: "users",
    initialState: {
        currentUser: null,
    },
    reducers: {
        SetCurrentUser : (state, action) => {
            state.currentUser = action.payload
        }
    }
})

export const { SetCurrentUser } = usersSlice.actions
export default usersSlice.reducer