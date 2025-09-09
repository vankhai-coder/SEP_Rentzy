import { useSelector, useDispatch } from "react-redux";
import { loginStart, loginSuccess, loginFailure, logout } from "../redux/features/UserSlice";
const Home = () => {
  const { user, loading, error } = useSelector((state) => state.userStore);
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(loginStart());
    try {
      // Fake API success
      const fakeUser = { id: 1, name: "John Doe", email: "john@example.com" };
      dispatch(loginSuccess(fakeUser));
    } catch (err) {
      console.log(err.message);
      dispatch(loginFailure("Login failed"));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Redux User Test</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {user ? (
        <>
          <p>Welcome, {user.name}!</p>
          <button onClick={() => dispatch(logout())}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}


export default Home