const redirect2Home = () => {
  window.location.href = window.location.origin;
};
const onTelegramAuth = async user => {
  console.log(JSON.stringify(user));
  sessionStorage.setItem('user', JSON.stringify(user));
  const response = await fetch(`${window.location.origin}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: user ? JSON.stringify(user) : undefined,
  });
  console.log('RESP', response.status);
  if (response.status === 200) {
    redirect2Home();
  } else {
    sessionStorage.clear();
  }
};
