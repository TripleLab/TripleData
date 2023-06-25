const axios = require('axios');

//let head = 'http://3.133.159.68:30020/';
let head = 'https://triplelab.xyz/v1/'

export const newAxios = async (url: any, json: any) => {
  let key: any =
    localStorage.getItem('login-with-metamask:auth') &&
    JSON.parse(localStorage.getItem('login-with-metamask:auth') || '');
  // let token =
  //   'Bearer ' +
  //   'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4YTc0ODJkMjg3MmNhMTVlMDE4NzM1YjhhYjBhMDAwMyIsImlubmVyLXRva2VuIjpmYWxzZSwiY3JlYXRlZCI6MTY4MjA1NzQ5NTc0OSwiZXhwIjoxNjg4MDU3NDk1fQ.DwPUw53UtP7Gss-RhN8d3CTvPrqYabByk33d0wP6am_dHQUrxbszBEMwkSVm4Nnw_yToxXGgET62S_zDL3J9Mg';
  let token = 'Bearer ' + key.token;
  let callback;
  await axios({
    url: head + url,
    method: 'post',
    timeout: 60000,
    headers: {
      Authorization: token,
    },
    data: json,
  }).then(function (response: any) {
    // console.log('res', response);
    callback = response.data;
  });
  return callback;
};
