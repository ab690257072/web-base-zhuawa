interface IOptions {
    url: string;
    type?: "GET" | "POST";
    data: any;
    timeout?: number;
}

function formatUrl(object) {
    // a=xxx&b=xxxx; querystring
    let dataArr = [];

    for (let key in object) {
        dataArr.push(`${key}=${encodeURIComponent(object[key])}`);
    }
    return dataArr.join("&");
}

export function ajax(
    options: IOptions = {
        type: "GET",
        data: {},
        timeout: 3000,
        url: "",
    }
) {
    return new Promise((resolve, reject) => {
        if (!options.url) {
            return;
        }

        const queryString = formatUrl(options.data);

        const onStateChange = () => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    clearTimeout(timer);
                    if (
                        (xhr.status >= 200 && xhr.status < 300) ||
                        xhr.status === 304
                    ) {
                        resolve(xhr.responseText);
                    } else {
                        reject(xhr.status);
                    }
                }
            };
        };

        let timer;
        let xhr;

        if ((window as any).XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        if (options.type.toUpperCase() === "GET") {
            xhr.open("GET", `${options.url}?${queryString}`);
            onStateChange();
            xhr.send();
        } else if (options.type.toUpperCase() === "POST") {
            xhr.open("POST", options.url);
            xhr.setRequestHeader(
                "ContentType",
                "application/x-www-form-urlencoded"
            );
            onStateChange();
            xhr.send(options.data);
        }

        if (options.timeout) {
            timer = setTimeout(() => {
                xhr.abort();
                reject("timeout");
            }, options.timeout);
        }
    });
}
