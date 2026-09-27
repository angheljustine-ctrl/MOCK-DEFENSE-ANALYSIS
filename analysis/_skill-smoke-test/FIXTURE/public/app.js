const form = document.querySelector('#request-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const item = document.querySelector('#item').value;

  if (!item.trim()) {
    alert('Item is required');
    return;
  }

  await fetch('/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: localStorage.getItem('studentId'),
      item,
    }),
  });

  alert('Request submitted');
});

