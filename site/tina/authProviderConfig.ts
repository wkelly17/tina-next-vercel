import {AbstractAuthProvider} from "tinacms";

export class CustomAuthProvider extends AbstractAuthProvider {
  constructor() {
    super();
    // Do any setup here
  }
  async authenticate(props?: {}): Promise<any> {
    // Do any authentication here
    const url = `${window.location.origin}/api/authenticate/login`;
    return window.location.replace(url);
  }
  async getToken() {
    const url = `${window.location.origin}/api/auth/authenticate`;
    try {
      const userRes = await fetch(url);
      const data = await userRes.json();
      if (data.token) {
        return {
          id_token: data.token,
        };
      } else {
        return {
          id_token: null,
        };
      }
    } catch (error) {
      console.log(error);
      return {
        id_token: null,
      };
    }
  }
  async getUser() {
    // Returns a truthy value, the user is logged in and if it returns a falsy value the user is not logged in.

    const url = `${window.location.origin}/api/auth/authenticate`;
    try {
      const userRes = await fetch(url);
      if (userRes.status === 200) {
        return true;
      } else return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  async logout() {
    const url = `${window.location.origin}/api/auth/logout`;
    return window.location.replace(url);

    // Do any logout logic here
  }
  async authorize(context?: any): Promise<any> {
    return {
      isAuthorized: true,
    };
    // Do any authorization logic here
  }
}
