# WoL Proxy Server

WoL Proxy Server sets up a proxy server that can wake a system using Wake-on-LAN (WoL) and proxy requests to it.

## 📚 Description

The server listens for incoming requests and checks if the target system is online. If the system is offline, it sends a WoL magic packet to wake it up and waits until the system is online before proxying the request.

## 📀 Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/ChemaAlfonso/WolProxy.git
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables (set the values as needed):
```env
PROXY_TO=http://target-system-address
PORT=4022
MAC_ADDRESS=00:11:22:33:44:55
CHECK_TIMEOUT=5000
CHECK_INTERVAL=5000
MAX_WAIT_TIME=60000
```

> **PROXY_TO**: The address of the system to proxy requests to.
> **PORT**: The port on which the proxy server will run.
> **MAC_ADDRESS**: The MAC address of the target system for WoL.
> **CHECK_TIMEOUT**: Timeout for checking if the target system is online.
> **CHECK_INTERVAL**: Interval between checks to see if the target system is online.
> **MAX_WAIT_TIME**: Maximum time to wait for the target system to come online.


## 🔨 Usage

##### Start the server:

```bash
npm start
```

##### Service status:
This is the unique endpoint exposed by the WoL server itself.
Just returns the server and proxied services status.

> ⚠️ This does not make **wakeonlan**, just check and return **ok** ok **ko** based on status of WoL and the WoL proxied service.

```bash
curl http://localhost:4022/wolstatus
```
```json
{
	"ok": true,
	"server": "ok",
	"proxiedService": "ko"
}
```

##### Any other request:

Any other request will be made to the **PROXY_TO** service but making wakeonlan before if required. You just need to make the request to the configured WolProxy server instead.

```bash
# Having:
#	PROXY_TO=http://my-awesome-service.com
#	MAC_ADDRESS=00:11:22:33:44:55

curl http://localhost:4022/api

# will:
# 1. wakeonlan 00:11:22:33:44:55 (if proxiedService is "ko")
# 2. make the request to http://my-awesome-service.com/api
```

## 🧞‍♂️ Motivations
This project was initialy created to handle home "AI on demand computation" on a more powerfull system.
I don't want the system enabled 24h a day due to power consumtion but required to be available when required.

Using WolProxy on a raspeberry pi and setting the AI service enabled at start on the main pc, i have always the AI computation available to handle AI requests to the raspberry using the power of the main device.

This is just an example of personal use case, but use it as you want.

## License
This project is licensed under the MIT License.