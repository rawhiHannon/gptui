import React, { Component } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button } from 'react-bootstrap'; // Assuming you're using Bootstrap for styling

import Auth from "../../controllers/auth";
// import Footer from "components/Footer/Footer";
import CustomButton from "../../components/CustomButton/CustomButton.jsx";
import AlertDismissible from "../../components/AlertDismissible/AlertDismissible.jsx";

import logo from "../../assets/logo.png";

import "./Login.css";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectToReferrer: false,
      username: "",
      password: "",
      errorMessage: ""
    };
  }

  login = event => {
    event.preventDefault();
    event.stopPropagation();

    return Auth.authenticate(this.state.username, this.state.password).then(
      ({ success, message }) => {
        if (!success) {
          this.setState({
            errorMessage: message || "Wrong."
          });
        }

        if (success) {
          Auth.syncDetails();
          this.setState({ redirectToReferrer: true });
        }
      }
    );
  };

  clearErrorMessage = () => {
    this.setState({ errorMessage: "" });
  };

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  render() {
    if(Auth.isAuthenticated === true) {
      return <Navigate to={{ pathname: "/" }} />;
    }
    // this.clearErrorMessage();
    let { from } = this.props.location.state || { from: { pathname: "/" } };
    let { redirectToReferrer, errorMessage } = this.state;

    if (redirectToReferrer) return <Navigate to={from} />;

    // const message = `You must log in to view the page at ${from.pathname}`;

    return (
      <div className="login-container">
        <div className="login-box">
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
              <button className="close-btn" onClick={this.clearErrorMessage}>
                X
              </button>
            </div>
          )}

          <div className="logo-container">
            <img src={logo} alt="logo_image" className="logo" />
          </div>

          <form onSubmit={this.login}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                className="login-label"
                id="username"
                type="text"
                placeholder="Username"
                value={this.state.username}
                onChange={this.handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                className="login-label"
                id="password"
                type="password"
                placeholder="Password"
                value={this.state.password}
                onChange={this.handleChange}
              />
            </div>
            <div className="text-center">
              <button onClick={this.login} className="login-btn">
                Login
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
