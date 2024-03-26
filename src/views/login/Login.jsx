import React, { Component } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Auth from "../../controllers/auth";
import logo from "../../assets/logo.png";
import "./Login.css";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectToReferrer: false,
      username: "",
      password: "",
      errorMessage: "",
      isLoggingIn: false,
    };
  }

  login = async (event) => {
    event.preventDefault();

    const { username, password } = this.state;

    if (!username || !password) {
      this.setState({ errorMessage: 'Please fill in all fields.' });
      return;
    }

    this.setState({ isLoggingIn: true });

    const response = await Auth.authenticate(username, password);

    if (!response.success) {
      this.setState({
        errorMessage: response.message || "Login failed.",
        isLoggingIn: false,
      });
    } else {
      Auth.syncDetails();
      this.setState({ redirectToReferrer: true });
    }
  };

  clearErrorMessage = () => {
    this.setState({ errorMessage: "" });
  };

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  render() {
    if(Auth.isAuthenticated) {
      return <Navigate to={{ pathname: "/" }} />;
    }

    const { redirectToReferrer, errorMessage, isLoggingIn } = this.state;

    if (redirectToReferrer) return <Navigate to={this.props.location.state?.from || '/'} />;

    return (
      <div className="login-container">
        <div className="login-box">
          {errorMessage && (
            <div className="error-message">
              <button className="close-btn" onClick={this.clearErrorMessage}>×</button>
              {errorMessage}
            </div>
          )}
          <div className="logo-container">
            <img src={logo} alt="logo" className="logo" />
          </div>
          <form onSubmit={this.login}>
            <div className="form-group">
              {/* <label htmlFor="username">Username</label> */}
              <input
                className="login-label"
                id="username"
                type="text"
                placeholder="Username"
                value={this.state.username}
                onChange={this.handleChange}
                disabled={isLoggingIn}
                required
              />
            </div>
            <div className="form-group">
              {/* <label htmlFor="password">Password</label> */}
              <input
                className="login-label"
                id="password"
                type="password"
                placeholder="Password"
                value={this.state.password}
                onChange={this.handleChange}
                disabled={isLoggingIn}
                required
              />
            </div>
            <div className="text-center">
              <button type="submit" className="login-btn" disabled={isLoggingIn}>
                {isLoggingIn ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}


function LoginWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  return <Login location={location} navigate={navigate} />;
}

export default LoginWrapper;
