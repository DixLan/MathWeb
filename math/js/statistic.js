 // ============================
    // 1) Gestion du changement de mode
    // ============================
    const modeSelect = document.getElementById('mode-select');
    const blocIndividus = document.getElementById('bloc-individus');
    const blocEffectif = document.getElementById('bloc-effectif');
    const blocCsvIndividus = document.getElementById('bloc-csv-individus');
    const blocCsvEffectif = document.getElementById('bloc-csv-effectif');

    modeSelect.addEventListener('change', function() {
      const mode = modeSelect.value;
      blocIndividus.classList.add('hidden');
      blocEffectif.classList.add('hidden');
      blocCsvIndividus.classList.add('hidden');
      blocCsvEffectif.classList.add('hidden');

      if (mode === 'individus') {
        blocIndividus.classList.remove('hidden');
      } else if (mode === 'effectif') {
        blocEffectif.classList.remove('hidden');
      } else if (mode === 'csv-individus') {
        blocCsvIndividus.classList.remove('hidden');
      } else if (mode === 'csv-effectif') {
        blocCsvEffectif.classList.remove('hidden');
      }
    });

    // ============================
    // 2) Génération du tableau : mode "Saisie par individu"
    // ============================
    const formIndividus = document.getElementById('form-individus');
    const tableIndividus = document.getElementById('table-individus');
    formIndividus.addEventListener('submit', function(e) {
      e.preventDefault();
      const n = parseInt(document.getElementById('individus-count').value, 10);
      if (isNaN(n) || n < 1) return;

      // Nettoyage des anciennes lignes
      while (tableIndividus.rows.length > 1) {
        tableIndividus.deleteRow(1);
      }

      // Génération
      for (let i = 1; i <= n; i++) {
        const row = tableIndividus.insertRow();
        // ID
        const cellId = row.insertCell();
        cellId.textContent = i;
        // Name
        const cellName = row.insertCell();
        cellName.innerHTML = `<input type="text" placeholder="Name ${i}">`;
        // Value
        const cellVal = row.insertCell();
        cellVal.innerHTML = `<input type="text" placeholder="Value ${i}">`;
      }
    });

    // ============================
    // 3) Génération du tableau : mode "Saisie par effectif"
    // ============================
    const formEffectif = document.getElementById('form-effectif');
    const tableEffectif = document.getElementById('table-effectif');
    formEffectif.addEventListener('submit', function(e) {
      e.preventDefault();
      const n = parseInt(document.getElementById('effectif-count').value, 10);
      if (isNaN(n) || n < 1) return;

      // Nettoyage
      while (tableEffectif.rows.length > 1) {
        tableEffectif.deleteRow(1);
      }

      for (let i = 1; i <= n; i++) {
        const row = tableEffectif.insertRow();
        // ID
        const cellId = row.insertCell();
        cellId.textContent = i;
        // Valeur
        const cellVal = row.insertCell();
        cellVal.innerHTML = `<input type="number" step="any" placeholder="Valeur">`;
        // Effectif
        const cellEff = row.insertCell();
        cellEff.innerHTML = `<input type="number" step="any" placeholder="Effectif">`;
      }
    });

    // ============================
    // 4) Import CSV - Individus
    // ============================
    const fileCsvIndividus = document.getElementById('file-csv-individus');
    let csvDataIndividus = [];  // stockera le contenu du CSV (Name,Value)
    fileCsvIndividus.addEventListener('change', function() {
      const file = fileCsvIndividus.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const text = e.target.result;
        // On parse ligne par ligne
        csvDataIndividus = [];
        const lines = text.split(/\r?\n/);
        for (let line of lines) {
          const [name, value] = line.split(',');
          if (name !== undefined && value !== undefined) {
            csvDataIndividus.push({ name: name.trim(), value: value.trim() });
          }
        }
        alert("CSV (individus) chargé avec succès. (" + csvDataIndividus.length + " lignes)");
      };
      reader.readAsText(file, 'utf-8');
    });

    // ============================
    // 5) Import CSV - Effectif
    // ============================
    const fileCsvEffectif = document.getElementById('file-csv-effectif');
    let csvDataEffectif = []; // stockera (valeur, effectif)
    fileCsvEffectif.addEventListener('change', function() {
      const file = fileCsvEffectif.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const text = e.target.result;
        csvDataEffectif = [];
        const lines = text.split(/\r?\n/);
        for (let line of lines) {
          const [valStr, effStr] = line.split(',');
          if (valStr !== undefined && effStr !== undefined) {
            csvDataEffectif.push({
              value: valStr.trim(),
              effectif: effStr.trim()
            });
          }
        }
        alert("CSV (effectif) chargé avec succès. (" + csvDataEffectif.length + " lignes)");
      };
      reader.readAsText(file, 'utf-8');
    });

    // ============================
    // 6) Bouton "Calculer les stats"
    // ============================
    const btnCalculer = document.getElementById('btn-calculer');

    // Éléments pour affichage des résultats quanti
    const meanSpan   = document.getElementById('mean');
    const medianSpan = document.getElementById('median');
    const varSpan    = document.getElementById('variance');
    const stdSpan    = document.getElementById('stddev');
    const cvSpan     = document.getElementById('cv');
    const freqQuantiList = document.getElementById('freq-quanti');
    const barQuantiCanvas = document.getElementById('bar-quanti');
    const pieQuantiCanvas = document.getElementById('pie-quanti');

    // Éléments pour affichage des résultats quali
    const freqQualiList = document.getElementById('freq-quali');
    const barQualiCanvas = document.getElementById('bar-quali');
    const pieQualiCanvas = document.getElementById('pie-quali');

    // Instances Chart.js à détruire avant recréation
    let barQuantiChart, pieQuantiChart;
    let barQualiChart, pieQualiChart;

    btnCalculer.addEventListener('click', function() {
      // On identifie le mode
      const mode = modeSelect.value;

      // On va remplir deux tableaux (comme dans les exemples précédents)
      // dataQuanti = [ ... ]   (liste de nombres, en mode Individus OU on reconstruit depuis effectifs)
      // dataQuali = [ ... ]    (liste de chaînes)

      let dataQuanti = [];
      let dataQuali = [];

      if (mode === 'individus') {
        // Parcourir tableIndividus
        const nbRows = tableIndividus.rows.length - 1;
        for (let i = 1; i <= nbRows; i++) {
          const row = tableIndividus.rows[i];
          const name = row.cells[1].querySelector('input').value.trim();
          const valStr = row.cells[2].querySelector('input').value.trim();

          const num = parseFloat(valStr);
          if (!isNaN(num)) {
            // => quanti
            dataQuanti.push(num);
          } else {
            // => quali
            dataQuali.push(valStr);
          }
        }

      } else if (mode === 'effectif') {
        // Parcourir tableEffectif (Valeur, Effectif)
        const nbRows = tableEffectif.rows.length - 1;
        // On considère qu'ici on fait du quantitatif discret
        // On calculera stats via effectifs
        // => On ne stocke pas "chaque individu", mais on va calculer la somme
        //    Weighted. Par contre, si on veut pour la freq on doit reconstituer
        //    la distribution ou compter direct.
        // dataQuanti contiendra en "version longue" ou on calcule direct la distribution
        let effectifArray = []; 
        // ex: effectifArray = [ { x: 1, n: 2 }, { x: 2, n: 25 }, ... ]
        for (let i = 1; i <= nbRows; i++) {
          const row = tableEffectif.rows[i];
          const val = parseFloat(row.cells[1].querySelector('input').value);
          const eff = parseFloat(row.cells[2].querySelector('input').value);
          if (!isNaN(val) && !isNaN(eff) && eff>0) {
            effectifArray.push({ x: val, n: eff });
          }
        }

        // On calcule la moyenne, variance, etc. direct via les formules d'effectifs
        // Mais si on veut générer la "distribution" pour un diagramme en bâtons,
        // on peut, soit générer un objet freq tout de suite, soit reconstituer
        // un tableau dataQuanti qui répète val "n" fois (possible, mais attention au
        // volume si n est grand).
        // Ici, on va faire un objet freqQuanti = {val: effectif, ...}
        const freqQuantiObj = {};
        let sum_xn = 0;  // somme (x_i * n_i)
        let sumN = 0;    // total effectif
        for (let item of effectifArray) {
          // on l'enregistre pour le chart
          freqQuantiObj[item.x] = (freqQuantiObj[item.x] || 0) + item.n;
          sum_xn += item.x * item.n;
          sumN   += item.n;
        }
        const meanVal = sum_xn / sumN;
        // variance = (1/sumN) * Σ [ n_i*(x_i - mean)^2 ]
        let sumSq = 0;
        for (let item of effectifArray) {
          sumSq += item.n * (item.x - meanVal)**2;
        }
        const variance = sumSq / sumN;
        const stddev = Math.sqrt(variance);
        const cv = (meanVal !== 0) ? (stddev/meanVal)*100 : 0;

        // Affichage
        meanSpan.textContent = meanVal.toFixed(2);
        medianSpan.textContent = calcMedianFromEffectifs(effectifArray).toFixed(2);
        varSpan.textContent = variance.toFixed(2);
        stdSpan.textContent = stddev.toFixed(2);
        cvSpan.textContent = cv.toFixed(2) + " %";

        // On affiche la distribution dans freq-quanti
        freqQuantiList.innerHTML = "";
        for (let key in freqQuantiObj) {
          const li = document.createElement('li');
          li.textContent = `Valeur = ${key}, Effectif = ${freqQuantiObj[key]}`;
          freqQuantiList.appendChild(li);
        }

        // On détruit d'anciens charts si besoin
        if (barQuantiChart) barQuantiChart.destroy();
        if (pieQuantiChart) pieQuantiChart.destroy();

        // Création bar/pie chart quanti
        const labels = Object.keys(freqQuantiObj);
        const dataVals = Object.values(freqQuantiObj);

        barQuantiChart = new Chart(barQuantiCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Effectif (quanti discret)',
              data: dataVals,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: { 
            scales: {
              y: { beginAtZero: true },
              x: { title: { display: true, text: 'Valeurs' } }
            }
          }
        });

        pieQuantiChart = new Chart(pieQuantiCanvas.getContext('2d'), {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              label: 'Effectif (quanti)',
              data: dataVals,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)'
              ]
            }]
          },
          options: {}
        });

        // Rien pour le quali => on vide
        freqQualiList.innerHTML = "";
        if (barQualiChart) barQualiChart.destroy();
        if (pieQualiChart) pieQualiChart.destroy();
        return; // on sort, le mode effectif est géré en direct
      }
      else if (mode === 'csv-individus') {
        // On utilise csvDataIndividus
        // { name, value }
        for (let item of csvDataIndividus) {
          const numVal = parseFloat(item.value);
          if (!isNaN(numVal)) {
            dataQuanti.push(numVal);
          } else {
            dataQuali.push(item.value);
          }
        }
      }
      else if (mode === 'csv-effectif') {
        // On utilise csvDataEffectif
        // { value, effectif }
        let effectifArray = [];
        for (let item of csvDataEffectif) {
          const x = parseFloat(item.value);
          const n = parseFloat(item.effectif);
          if (!isNaN(x) && !isNaN(n) && n>0) {
            effectifArray.push({ x, n });
          }
        }
        // Idem que plus haut
        let sum_xn = 0;
        let sumN = 0;
        const freqQuantiObj = {};
        for (let obj of effectifArray) {
          sum_xn += obj.x * obj.n;
          sumN   += obj.n;
          freqQuantiObj[obj.x] = (freqQuantiObj[obj.x] || 0) + obj.n;
        }
        const meanVal = sum_xn / sumN;
        let sumSq = 0;
        for (let obj of effectifArray) {
          sumSq += obj.n * ((obj.x - meanVal)**2);
        }
        const variance = sumSq / sumN;
        const stddev = Math.sqrt(variance);
        const cv = (meanVal!==0)? (stddev/meanVal)*100 : 0;

        meanSpan.textContent = meanVal.toFixed(2);
        medianSpan.textContent = calcMedianFromEffectifs(effectifArray).toFixed(2);
        varSpan.textContent = variance.toFixed(2);
        stdSpan.textContent = stddev.toFixed(2);
        cvSpan.textContent = cv.toFixed(2) + " %";

        freqQuantiList.innerHTML = "";
        for (let key in freqQuantiObj) {
          const li = document.createElement('li');
          li.textContent = `Valeur = ${key}, Effectif = ${freqQuantiObj[key]}`;
          freqQuantiList.appendChild(li);
        }

        // Graphes quanti
        if (barQuantiChart) barQuantiChart.destroy();
        if (pieQuantiChart) pieQuantiChart.destroy();

        const labels = Object.keys(freqQuantiObj);
        const dataVals = Object.values(freqQuantiObj);

        barQuantiChart = new Chart(barQuantiCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Effectif (CSV)',
              data: dataVals,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
            }]
          },
          options: { scales: { y: { beginAtZero: true } } }
        });
        pieQuantiChart = new Chart(pieQuantiCanvas.getContext('2d'), {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: dataVals,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)'
              ]
            }]
          }
        });

        // Pas de quali => on vide
        freqQualiList.innerHTML = "";
        if (barQualiChart) barQualiChart.destroy();
        if (pieQualiChart) pieQualiChart.destroy();
        return;
      }

      // ============================
      // Si on arrive ici, c'est qu'on est en mode "Individus" (table) ou "CSV - Individus"
      // et qu'on a dataQuanti et dataQuali à traiter
      // ============================
      // Calcul stats quanti
      if (dataQuanti.length > 0) {
        const meanVal = calcMean(dataQuanti);
        const medianVal = calcMedian(dataQuanti);
        const varianceVal = calcVariance(dataQuanti, meanVal);
        const stddevVal = Math.sqrt(varianceVal);
        const cvVal = (meanVal!==0) ? (stddevVal/meanVal)*100 : 0;

        meanSpan.textContent = meanVal.toFixed(2);
        medianSpan.textContent = medianVal.toFixed(2);
        varSpan.textContent = varianceVal.toFixed(2);
        stdSpan.textContent = stddevVal.toFixed(2);
        cvSpan.textContent = cvVal.toFixed(2) + " %";

        // Fréquence sur les valeurs (unique)
        const freqObj = calcFrequency(dataQuanti.map(x => x.toString()));
        freqQuantiList.innerHTML = "";
        for (let valStr in freqObj) {
          const li = document.createElement('li');
          li.textContent = `Valeur = ${valStr} : ${freqObj[valStr]} occurrence(s)`;
          freqQuantiList.appendChild(li);
        }

        // Graphes quanti
        if (barQuantiChart) barQuantiChart.destroy();
        if (pieQuantiChart) pieQuantiChart.destroy();

        const labels = Object.keys(freqObj);
        const dataVals = Object.values(freqObj);

        barQuantiChart = new Chart(barQuantiCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Fréquence (Quanti)',
              data: dataVals,
              backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
          },
          options: { scales: { y: { beginAtZero: true } } }
        });

        pieQuantiChart = new Chart(pieQuantiCanvas.getContext('2d'), {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: dataVals,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)'
              ]
            }]
          },
          options: {}
        });

      } else {
        // Pas de quanti
        meanSpan.textContent = "";
        medianSpan.textContent = "";
        varSpan.textContent = "";
        stdSpan.textContent = "";
        cvSpan.textContent = "";
        freqQuantiList.innerHTML = "";
        if (barQuantiChart) barQuantiChart.destroy();
        if (pieQuantiChart) pieQuantiChart.destroy();
      }

      // Calcul stats quali (principalement la fréquence)
      if (dataQuali.length > 0) {
        const freqObjQ = calcFrequency(dataQuali);
        freqQualiList.innerHTML = "";
        for (let valStr in freqObjQ) {
          const li = document.createElement('li');
          li.textContent = `Modalité = "${valStr}" : ${freqObjQ[valStr]} occurrence(s)`;
          freqQualiList.appendChild(li);
        }

        if (barQualiChart) barQualiChart.destroy();
        if (pieQualiChart) pieQualiChart.destroy();

        const labelsQ = Object.keys(freqObjQ);
        const dataValsQ = Object.values(freqObjQ);

        barQualiChart = new Chart(barQualiCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labelsQ,
            datasets: [{
              label: 'Fréquence (Quali)',
              data: dataValsQ,
              backgroundColor: 'rgba(255, 159, 64, 0.5)'
            }]
          },
          options: {
            scales: { y: { beginAtZero: true } }
          }
        });

        pieQualiChart = new Chart(pieQualiCanvas.getContext('2d'), {
          type: 'pie',
          data: {
            labels: labelsQ,
            datasets: [{
              data: dataValsQ,
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)'
              ]
            }]
          },
          options: {}
        });
      } else {
        // Pas de quali
        freqQualiList.innerHTML = "";
        if (barQualiChart) barQualiChart.destroy();
        if (pieQualiChart) pieQualiChart.destroy();
      }
    });

    // ============================
    // 7) Fonctions utilitaires
    // ============================
    function calcMean(arr) {
      const sum = arr.reduce((acc, val) => acc + val, 0);
      return sum / arr.length;
    }

    function calcMedian(arr) {
      const sorted = [...arr].sort((a,b)=>a-b);
      const n = sorted.length;
      if (n===0) return NaN;
      if (n % 2 === 1) {
        return sorted[(n-1)/2];
      } else {
        const mid1 = sorted[n/2 - 1];
        const mid2 = sorted[n/2];
        return (mid1+mid2)/2;
      }
    }

    // Méthode pour trouver la médiane à partir d'une liste (x,n)
    // triée par x croissant
    function calcMedianFromEffectifs(array) {
      // trier par x croissant
      const sorted = [...array].sort((a,b)=>a.x-b.x);
      const total = sorted.reduce((acc, item)=>acc+item.n, 0);
      const half = total/2;
      let cumul = 0;
      for (let item of sorted) {
        cumul += item.n;
        if (cumul >= half) {
          // On trouve la classe (ou la valeur) où se situe la médiane
          return item.x; 
          // (Pour être plus précis, si c'est discret on peut s'arrêter là,
          //  si c'était groupé en classes continues, on ferait une interpolation.)
        }
      }
      return NaN; 
    }

    function calcVariance(arr, meanVal) {
      if (arr.length === 0) return NaN;
      const sumSq = arr.reduce((acc, val) => acc + (val - meanVal)**2, 0);
      return sumSq / arr.length;  // population
    }

    // calcFrequency(tableau) => {valeur: nbOccurrences, ...}
    function calcFrequency(arr) {
      const freq = {};
      for (let val of arr) {
        freq[val] = (freq[val]||0) + 1;
      }
      return freq;
    }