# Ez Networking (Works with React too)
An easy library for handling stateful token based authentication. Uses zustand and axios. 



use the auth store too handle check whether user is logged in, to log out, etc.
## Setup
`npm install react-native-simple-networking`

## for example
Setup like this, *you must pass a refresh token function to axiosOptions*
```js
import init from 'react-native-simple-networking';
const {useAuthStore, axiosClient} = init({
    axiosOptions: {
        refresh: refreshToken,
        axiosConfig: {
            baseURL: baseUrl
        },
        defaultHeaders: {
            'x-api-key': 'test-key',
        }
    },
    authStoreOptions: {
        persistence: {
            name: '@nodit/auth2',
            setItem: (name, value) => {
                return mmkvStorage.set(name, value)
              },
              getItem: (name) => {
                const value = mmkvStorage.getString(name)
                return value ?? null
              },
              removeItem: (name) => {
                return mmkvStorage.delete(name)
              },
        },
    },
    
})
```

Make requests with the axios client: 
```js
axiosClient.get('https://fakeapi.com/fake-endpoint
```


And in your component use the store:

```js
function Component() {
  const login = useAuthStore(s=>s.login);
  //...
  async function onFormSubmit() {
    const {accessToken, refreshToken} = await postLogin(email, password);
    login(accessToken, refreshToken); // This will update the state.
  }
}
```

When you want to check if you're logged in:

```js
function AmILoggedInComponent(){
  const isLoggedIn = useAuthStore(s=>s.isLoggedIn);
  if(!isLoggedIn) return <No/>
  return <Yes/>
}
```

## Making Authenticated Requests

Just use the axios client to make requests.

And in your networking function
```ts
async function fetchStuff() {
  const r = await axiosClient.get('https://stuff.com/json');
}
```

## Auth Store Interface
```ts
interface AuthStore {
    isLoggedIn: boolean,
    login: (token: string, refreshToken: string) => void,
    logout: () => void,
    setAccessToken: (v: string) => void,
    token: string | null,
    refreshToken: string | null,
}
```

## Auth Store Options
All Optionals 
```ts
interface AuthStoreOptions {
    persistence?: {
        getItem: (key: string) => Promise<string | null> | (string | null),
        setItem: (key: string, value: string) => void | Promise<void>,
        removeItem: (key: string)=>(void | Promise<void>),
        name: string,
    },
    onTokensChange?: (tokens: {access: string, refresh: string})=>void,
    defaultCredentials?: {
        token: string,
        refreshToken: string,
    },
    onLogout?: ()=>void,
}
```

## Axios Options

```ts
interface AxiosOptions {
    axiosConfig?: AxiosRequestConfig,
    refresh: (token: string)=>Promise<string>,
    attemptRefreshOnStatusCodes?: number[],
    defaultHeaders?: {[name: string]: string},
}
```
