let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');

socket.onopen = () => console.log('Successfully Connected');

socket.onclose = (event) => {
  console.log('Socket Closed Connection: ', event);
  socket.send('Client Closed!');
};

socket.onerror = (error) => console.log('Socket Error: ', error);

// const ifHit = (currHits, prevHits) => {
//   const allCurrHits =
//     currHits['0'] + currHits['50'] + currHits['100'] + currHits['300'];
//   const allPrevHits =
//     prevHits !== null
//       ? prevHits['0'] + prevHits['50'] + prevHits['100'] + prevHits['300']
//       : 0;
//   return (allCurrHits > 1 && prevHits === null) || allCurrHits > allPrevHits;
// };
const ifErrorHit = (currHits, prevHits) => {
  const allCurrErrors = currHits['50'] + currHits['100'];
  const allPrevErrors =
    prevHits !== null ? prevHits['50'] + prevHits['100'] : 0;
  return (
    (allCurrErrors > 1 && prevHits === null) || allCurrErrors > allPrevErrors
  );
};

const setOffsetEarly = (latestError, error, error_offset) => {
  error.innerHTML = `Early`;
  error_offset.innerHTML = `${-latestError}ms`;
  let errorVal = Math.min(Math.abs(latestError), 100);
  error.style.color = 'rgb(0, 128, 255)';
  error_offset.style.color = 'rgb(0, 128, 255)';
  error_offset.style.fontSize = `${0.3 + (0.5 / 100) * errorVal}rem`;
};

const setOffsetLate = (latestError, error, error_offset) => {
  error.innerHTML = `Late`;
  error_offset.innerHTML = `${latestError}ms`;
  let errorVal = Math.min(Math.abs(latestError), 100);
  error.style.color = 'red';
  error_offset.style.color = 'red';
  error_offset.style.fontSize = `${0.3 + (0.5 / 100) * errorVal}rem`;
};

function reset_animation() {
  const el = document.getElementById('error');
  const el_o = document.getElementById('error-offset');
  el.style.animation = 'none';
  el_o.style.animation = 'none';
  el.offsetHeight; /* trigger reflow */
  el_o.offsetHeight;
  el.style.animation = null;
  el_o.style.animation = null;
}

const error = document.getElementById('error');
const error_offset = document.getElementById('error-offset');

let prevHits = null;
let currHits = null;
socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data),
      hits = data.gameplay.hits;
    const hitErrors = hits.hitErrorArray;
    // console.log(data);
    if (hitErrors) {
      // console.log(hitErrors);
      currHits = hits;
      if (ifErrorHit(currHits, prevHits)) {
        // console.log('Prev');
        // console.log(prevHits);
        // console.log('Curr');
        // console.log(currHits);
        let latestError = hitErrors[hitErrors.length - 1];
        reset_animation();
        if (latestError < 0) {
          setOffsetEarly(latestError, error, error_offset);
        } else {
          setOffsetLate(latestError, error, error_offset);
        }
      }
      prevHits = currHits;
    }
  } catch (err) {
    console.log(err);
  }
};
