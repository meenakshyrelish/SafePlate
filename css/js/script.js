const pills = document.querySelectorAll('.allergy-pill:not(.custom-pill)');
const submitBtn = document.getElementById('submitBtn');
const customBtn = document.getElementById('customBtn');

let selectedAllergies = [];

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pill.classList.toggle('selected');
    const allergy = pill.dataset.allergy;

    if (pill.classList.contains('selected')) {
      selectedAllergies.push(allergy);
    } else {
      selectedAllergies = selectedAllergies.filter(a => a !== allergy);
    }

    submitBtn.disabled = selectedAllergies.length === 0;
  });
});

customBtn.addEventListener('click', () => {
  const custom = prompt('Enter your allergy:');
  if (custom && custom.trim() !== '') {
    selectedAllergies.push(custom.trim());
    submitBtn.disabled = false;
    alert(`Added: ${custom.trim()}`);
  }
});

submitBtn.addEventListener('click', () => {
  console.log('Selected allergies:', selectedAllergies);
  // Next: redirect to results.html and pass selectedAllergies along
  alert(`Great! You selected: ${selectedAllergies.join(', ')}`);
});