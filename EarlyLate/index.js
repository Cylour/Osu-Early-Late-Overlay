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

const setOffsetEarly = (
  curr_error,
  error,
  err_combo_val,
  error_combo,
  error_offset,
  error_line
) => {
  error.innerHTML = `EARLY`;
  error_combo.innerHTML = `&times${err_combo_val}`;
  error_offset.innerHTML = `${-curr_error}ms`;
  error.style.color = 'rgb(0, 128, 255)';
  error_combo.style.color = 'rgb(0, 128, 255)';
  error_offset.style.color = 'rgb(0, 128, 255)';
  error_line.style.backgroundColor = 'rgb(0, 128, 255)';
  let errorVal = Math.min(Math.abs(curr_error), 100);
  error_offset.style.fontSize = `${0.3 + (0.5 / 100) * errorVal}rem`;
  error_line.style.boxShadow = `0px 0px 50px ${
    15 + (20 / 100) * errorVal
  }px rgb(0, 128, 255)`;
};

const setOffsetLate = (
  curr_error,
  error,
  err_combo_val,
  error_combo,
  error_offset,
  error_line
) => {
  error.innerHTML = `LATE`;
  error_combo.innerHTML = `&times${err_combo_val}`;
  error_offset.innerHTML = `${curr_error}ms`;
  error.style.color = 'red';
  error_combo.style.color = 'red';
  error_offset.style.color = 'red';
  error_line.style.backgroundColor = 'red';
  let errorVal = Math.min(Math.abs(curr_error), 100);
  error_offset.style.fontSize = `${0.3 + (0.5 / 100) * errorVal}rem`;
  error_line.style.boxShadow = `0px 0px 50px ${
    5 + (30 / 100) * errorVal
  }px red`;
};

const doResetAnimation = (element) => {
  element.style.animation = 'none';
  element.offsetHeight;
  element.style.animation = null;
};

const reset_animation = () => {
  const el = document.getElementById('error');
  const el_o = document.getElementById('error-offset');
  const el_l = document.getElementById('error-line');
  const el_c = document.getElementById('error-combo');
  doResetAnimation(el);
  doResetAnimation(el_o);
  doResetAnimation(el_l);
  doResetAnimation(el_c);
};

const error = document.getElementById('error');
const error_wrapper = document.getElementById('error-wrapper');
const error_offset = document.getElementById('error-offset');
const error_line = document.getElementById('error-line');
const error_combo = document.getElementById('error-combo');

let prev_hits = null;
let curr_hits = null;
let prev_error = null;
let err_combo_val = 0;

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data),
      hits = data.gameplay.hits;
    const hitErrors = hits.hitErrorArray;
    if (hitErrors) {
      curr_hits = hits;
      if (ifErrorHit(curr_hits, prev_hits)) {
        let curr_error = hitErrors[hitErrors.length - 1];
        reset_animation();
        if (curr_error < 0) {
          if (prev_error === null || prev_error >= 0) err_combo_val = 1;
          else err_combo_val++;
          err_combo_val === 1
            ? (error_combo.style.display = 'none')
            : (error_combo.style.display = 'block');
          document.documentElement.style.setProperty(
            '--combo-size',
            1 + Math.min(err_combo_val, 10) / 10
          );
          setOffsetEarly(
            curr_error,
            error,
            err_combo_val,
            error_combo,
            error_offset,
            error_line
          );
        } else {
          if (prev_error === null || prev_error < 0) err_combo_val = 1;
          else err_combo_val++;
          err_combo_val === 1
            ? (error_combo.style.display = 'none')
            : (error_combo.style.display = 'block');
          document.documentElement.style.setProperty(
            '--combo-size',
            1 + Math.min(err_combo_val, 10) / 10
          );
          setOffsetLate(
            curr_error,
            error,
            err_combo_val,
            error_combo,
            error_offset,
            error_line
          );
        }
        prev_error = curr_error;
      } else err_combo_val = 0;
      prev_hits = curr_hits;
    } else {
      prev_hits = null;
    }
  } catch (err) {
    console.log(err);
  }
};
