const btnLogout = document.querySelector('button[data-js="logout"]');
const formAllowed = document.querySelector('form[data-js="allow"]');
const textAreaAllowed = formAllowed.querySelector('textarea[data-js="allowed"]');
const btnSubmitAllowed = formAllowed.querySelector('button[data-js="submit"]');
const formBlocked = document.querySelector('form[data-js="block"]');
const textAreaBlocked = formBlocked.querySelector('textarea[data-js="blocked"]');
const btnSubmitBlocked = formBlocked.querySelector('button[data-js="submit"]');

btnLogout.addEventListener('click', () => {
  sessionStorage.removeItem('user');
  redirect2Login();
});

const submitWords = async (event, type) => {
  event.preventDefault();
  const user = sessionStorage.getItem('user') || undefined;
  const words = event.target.querySelector(`textarea[data-js="${type}"]`).value || '';
  const query = `?${type}=${words}`;
  const response = await fetch(`${window.location.origin}/words/${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: user,
  });
  if (response.status === 200) {
    alert('Salvo! 😊');
  } else {
    alert(
      `Ocorreu um erro${status.number ? ` de número ${status.number}` : ``} 😔 ao salvar: ${words}`,
    );
  }
  if ([401, 403].includes(response.status)) {
    redirect2Login();
  }
};
const getWords = async type => {
  const user = sessionStorage.getItem('user') || undefined;
  const response = await fetch(`${window.location.origin}/words?type=${type}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: user,
  });
  if ([401, 403].includes(response.status)) {
    redirect2Login();
  }
  const words = await response.text();
  return words;
};

const redirect2Login = () => {
  window.location.href = `${window.location.origin}/login`;
};

const isLogged = async () => {
  const user = sessionStorage.getItem('user');
  const response = await fetch(`${window.location.origin}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: user ? user : undefined,
  });
  if ([401, 403].includes(response.status)) {
    redirect2Login();
  } else if (response.status === 200) {
    const allowedWords = await getWords('allowed');
    const blockedWords = await getWords('blocked');
    textAreaAllowed.value = allowedWords;
    textAreaBlocked.value = blockedWords;
    document.querySelector('div[data-js="app"]').removeAttribute('hidden');
  }
};

formAllowed.addEventListener('submit', async event => {
  submitWords(event, 'allowed');
});

formBlocked.addEventListener('submit', async event => {
  submitWords(event, 'blocked');
});

isLogged();
