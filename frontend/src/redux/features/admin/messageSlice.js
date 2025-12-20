// src/redux/features/renter/recommendation/recommendationSlice.js
import { createSlice } from "@reduxjs/toolkit";

// const { userFullNameOrEmail, userIdToChatWith, userImageURL } = useSelector((state) => state.auth);


const messageSlice = createSlice({
    name: "message",
    initialState: {
        userFullNameOrEmail: null,
        userIdToChatWith: null,
        userImageURL: null,
    },
    reducers: {
        // function that add 3 state : action.payload = { userFullNameOrEmail, userIdToChatWith, userImageURL } 
        // and call by dispatch(setMessageUserDetails({ userFullNameOrEmail, userIdToChatWith, userImageURL }))
        setMessageUserDetails: (state, action) => {
            console.log("Setting message user details:", action.payload);
            state.userFullNameOrEmail = action.payload.userFullNameOrEmail;
            state.userIdToChatWith = action.payload.userIdToChatWith;
            state.userImageURL = action.payload.userImageURL;
        }
    },

});

// Export actions & reducer
export const { setMessageUserDetails } = messageSlice.actions;
export default messageSlice.reducer;