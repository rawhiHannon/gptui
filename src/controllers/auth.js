import moment from "moment";
import jwt_decode from 'jwt-decode';

import APIManager from "./manager";

class Auth {
  constructor() {
    this.prefix = 'metes_';
    this.isAuthenticated = false;
    this.isAdmin = false;

    this.syncDetails();
  }

  syncDetails() {
    let token = localStorage.getItem(this.prefix + 'token');

    try {
      const tokenDecoded = jwt_decode(token);
      this.isAdmin = (tokenDecoded.permission && tokenDecoded.permission === "admin") || false;
      if (moment().unix() > tokenDecoded.expire) {
        this.removeToken();
        token = null;
      }
    } catch(error) {
      // alert(error)
      token = null;
    }
    if (token) {
      this.isAuthenticated = true;
    }
  }

  isAdminUser() {
    return this.isAdmin;
  }

  getAuth() {
    if(!this.isAuthenticated) {
      // throw new Error('Not authenticated');
    }
    return 'Bearer ' + localStorage.getItem(this.prefix + 'token');
  }

  getToken() {
    return localStorage.getItem(this.prefix + 'token');
  }

  getUsername() {
    return localStorage.getItem(this.prefix + 'username') || "";
  }

  authenticate(username, password) {
    return APIManager.authorize(username, password)
      .then((response) => {

        if (response.error) {
          throw response.error
        }

        if (response && response.token) {
          this.setToken(response.token);
          this.setUsername(username);
          this.isAuthenticated = true;

          return {
            success: true,
            message: "",
          };
        }

        return {
          success: false,
          message: "",
        };
      })
      .catch((error) => {
        return {
          success: false,
          message: (error[0] && error[0].description) || "Wrong username or password."
        };
      })
  }

  setToken(token) {
    localStorage.setItem(this.prefix + 'token', token);
  }


  setUsername(username) {
    localStorage.setItem(this.prefix + 'username', username);
  }

  removeToken() {
    localStorage.removeItem(this.prefix + 'token');
  }

  signout() {
    this.removeToken();
    this.isAuthenticated = false;
  }
}

export default new Auth();