const ids = [
  'oHjZQsucTtI',
  'YRw7QL_vOL4',
  'DBwkHQsNUu4',
  '9rncxV94Ku0',
  '-pn1sSfAkco'
];

async function check() {
  for (const id of ids) {
    try {
      const res = await fetch('https://unsplash.com/photos/' + id);
      const html = await res.text();
      const match = html.match(/https:\/\/images\.unsplash\.com\/photo-[^"?]+/);
      if (match) {
        console.log(id, '-->', match[0]);
      } else {
        console.log(id, '--> No direct match');
      }
    } catch (e) {
      console.log(id, 'err', e.message);
    }
  }
}
check();
