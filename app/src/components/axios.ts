const axios = require('axios');

export const newAxios = async (url: any, json: any) => {
  let key: any =
    localStorage.getItem('login-with-metamask:auth') &&
    JSON.parse(localStorage.getItem('login-with-metamask:auth') || '');
  // let token =
  //   'Bearer ' +
  //   'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI4YTc0ODJkMjg3MmNhMTVlMDE4NzM1YjhhYjBhMDAwMyIsImlubmVyLXRva2VuIjpmYWxzZSwiY3JlYXRlZCI6MTY4MTg4Njc3Mzc0MiwiZXhwIjoxNjg3ODg2NzczfQ.F5z2AB6EMlvXq0NT0FKdAPk8OH_LfZYTtkEJHyCNAr-Tky0JPASelsWYUfvjJN3aOAfIFH95-g5yCN1-0zNERQ';
  let token = 'Bearer ' + key.token;
  let callback;
  await axios({
    url: url,
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