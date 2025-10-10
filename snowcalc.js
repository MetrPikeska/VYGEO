let gunCount = 0;

function addGun() {
  gunCount++;
  const div = document.createElement('div');
  div.className = 'gunRow';
  div.innerHTML = `
    <label>Dělo ${gunCount}: průtok (m³/h) 
      <input type="number" class="gunFlow" value="20">
    </label>`;
  document.getElementById('guns').appendChild(div);
}

function computeETA() {
  const V = parseFloat(document.getElementById('vol').value);
  const Vres = parseFloat(document.getElementById('res').value);
  const Qin = parseFloat(document.getElementById('qin').value);
  const Qpump = parseFloat(document.getElementById('pump').value);

  let Qguns = 0;
  document.querySelectorAll('.gunFlow').forEach(inp => {
    Qguns += parseFloat(inp.value) || 0;
  });

  const Qout = Math.min(Qguns, Qpump);
  let etaText = '–';

  if (Qout > Qin) {
    const hours = (V - Vres) / (Qout - Qin);
    etaText = hours.toFixed(1) + ' h';
  } else if (Qout === 0) {
    etaText = 'žádné dělo není aktivní';
  } else {
    etaText = 'nevyčerpá se (přítok ≥ odběr)';
  }

  document.getElementById('result').innerHTML = 
    `<strong>Zbývající čas zasněžování:</strong> ${etaText}<br>
     <small>(Odběr: ${Qout} m³/h, Přítok: ${Qin} m³/h)</small>`;
}
