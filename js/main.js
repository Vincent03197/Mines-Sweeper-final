"use strict";

const MINE = "💣";
const FLAG = "🚩";
const EMPTY = " ";

var gBoard = [];
var gCurrentLevel = "intermediate";
var gLivesCount;
var gMyInterval;
var gFirstClick = true;

var gCell = {
  minesAroundCount: 0,
  isShown: false,
  isMine: false,
  isMarked: false,
};

var gLevels = {
  beginner: {
    SIZE: 4,
    MINES: 2,
  },
  intermediate: {
    SIZE: 8,
    MINES: 12,
  },
  expert: {
    SIZE: 12,
    MINES: 30,
  },
};

var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
};

function setLevel(name) {
  gCurrentLevel = name;
  gBoard = [];
  initGame();
  console.log(name);
}

function buildBoard(SIZE) {
  for (var i = 0; i < SIZE; i++) {
    gBoard.push([]);
    for (var j = 0; j < SIZE; j++) {
      gBoard[i].push({ ...gCell });
    }
  }
  setMinesAndNegs();
  return gBoard;
}

function initGame() {
  var board = buildBoard(gLevels[gCurrentLevel].SIZE);
  renderBoard(board);
  gLivesCount = 3;
}

function renderBoard(board) {
  var strHTML = "<table><tbody>";
  for (var i = 0; i < board.length; i++) {
    strHTML += "<tr>";
    for (var j = 0; j < board[0].length; j++) {
      var cellClass = `cell-${i}-${j}`;
      strHTML += `<td class='cell ${cellClass}' onmouseup='cellClicked(event, ${i}, ${j})' oncontextmenu='cancelContextMenu(event)'></td>`;
    }
    strHTML += "</tr>";
  }
  strHTML += "</table></tbody>";
  var elContainer = document.querySelector(".board-container");
  elContainer.innerHTML = strHTML;
}

function cellClicked(event, givenI, givenJ) {
  if (gFirstClick && gBoard[givenI][givenJ].isMine) {
    gBoard = [];
    initGame();
    cellClicked(event, givenI, givenJ);
    startTimer();
    gFirstClick = false;
    return;
  }
  if (gFirstClick) {
    gFirstClick = false;
    startTimer();
  }
  if (checkIfWon()) return;

  var elCell = event.target;
  var cell = gBoard[givenI][givenJ];
  if (!gLivesCount) return;
  //right click
  if (event.which === 3) {
    if (cell.isShown) return;
    cell.isMarked = !cell.isMarked;
    elCell.innerHTML = cell.isMarked ? FLAG : "";
  }
  //left click
  else if (event.which === 1) {
    elCell.classList.add("clicked-cell");
    if (cell.isMarked || cell.isShown) return;
    cell.isShown = true;
    if (cell.isMine) {
      elCell.innerHTML = MINE;
      gLivesCount--;
      setLivesLeft();
      return;
    }
    openCells(givenI, givenJ);
  }
  checkIfWon();
}

function cancelContextMenu(event) {
  event.preventDefault();
}

function setRandomMines(number) {
  Array(number)
    .fill(undefined)
    .forEach(() => {
      setRandomMine();
    });
}

function setRandomMine() {
  var { i, j } = generateRandomCoords();
  if (gBoard[i][j].isMine) {
    setRandomMine();
    return;
  }
  gBoard[i][j].isMine = true;
}

function generateRandomCoords() {
  var rndInt = (max) => Math.floor(Math.random() * max) + 1;
  var i = rndInt(gLevels[gCurrentLevel].SIZE - 1);
  var j = rndInt(gLevels[gCurrentLevel].SIZE - 1);
  return { i, j };
}

function startTimer() {
  var minutesLabel = document.getElementById("minutes");
  var secondsLabel = document.getElementById("seconds");
  var totalSeconds = 0;
  gMyInterval = setInterval(setTime, 1000);

  function setTime() {
    ++totalSeconds;
    secondsLabel.innerHTML = pad(totalSeconds % 60);
    minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
  }

  function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
      return "0" + valString;
    } else {
      return valString;
    }
  }
}

function calculateNeighborsForAllBoard(SIZE) {
  for (var i = 0; i < SIZE; i++) {
    for (var j = 0; j < SIZE; j++) {
      if (gBoard[i][j].isMine) {
        calculateNeighborsForSingleCell(i, j);
      }
    }
  }
}

function calculateNeighborsForSingleCell(givenI, givenJ) {
  for (var i = givenI - 1; i <= givenI + 1; i++) {
    for (var j = givenJ - 1; j <= givenJ + 1; j++) {
      if (
        i < 0 ||
        j < 0 ||
        j > gLevels[gCurrentLevel].SIZE - 1 ||
        i > gLevels[gCurrentLevel].SIZE - 1
      )
        continue;
      var checkingCell = gBoard[i][j];
      if (checkingCell.isMine) continue;
      checkingCell.minesAroundCount++;
    }
  }
}

function openCells(givenI, givenJ) {
  var currentCell = gBoard[givenI][givenJ];
  if (currentCell.minesAroundCount > 0) {
    currentCell.isShown = true;
    renderCell({ i: givenI, j: givenJ }, currentCell.minesAroundCount || EMPTY);
    return;
  }
  for (var i = givenI - 1; i <= givenI + 1; i++) {
    for (var j = givenJ - 1; j <= givenJ + 1; j++) {
      if (
        i < 0 ||
        j < 0 ||
        j > gLevels[gCurrentLevel].SIZE - 1 ||
        i > gLevels[gCurrentLevel].SIZE - 1
      )
        continue;
      var checkingCell = gBoard[i][j];
      if (checkingCell.isMine || checkingCell.isShown) continue;
      if (checkingCell.minesAroundCount > 0) {
        checkingCell.isShown = true;
        renderCell({ i, j }, checkingCell.minesAroundCount || EMPTY);
      }
      if (checkingCell.minesAroundCount === 0) {
        checkingCell.isShown = true;
        openCells(i, j);
        renderCell({ i, j }, checkingCell.minesAroundCount || EMPTY);
      }
    }
  }
}

function renderCell(location, value) {
  var cell = gBoard[location.i][location.j];
  var elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
  if (!cell.isShown) return;
  elCell.classList.add("clicked-cell");
  elCell.innerHTML = value;
  switch (cell.minesAroundCount) {
    case 1:
      elCell.classList.add("one");
      break;
    case 2:
      elCell.classList.add("two");
      break;
    case 3:
      elCell.classList.add("three");
      break;
    case 4:
      elCell.classList.add("four");
      break;
    case 5:
      elCell.classList.add("five");
      break;
    case 6:
      elCell.classList.add("six");
      break;
    case 7:
      elCell.classList.add("seven");
      break;
    case 8:
      elCell.classList.add("eight");
      break;
  }
}

function setLivesLeft() {
  var elLives = document.querySelector(".lives2");
  var elSmiley = document.querySelector(".smiley");
  switch (gLivesCount) {
    case 3:
      elLives.innerText = "💖💖💖";
      break;
    case 2:
      elLives.innerText = "💖💖";
      elSmiley.innerText = "😯";
      break;
    case 1:
      elLives.innerText = "💖";
      elSmiley.innerText = "🥵";
      break;
    case 0:
      elLives.innerText = "";
      elSmiley.innerText = "Try Again ☠";
      gameOver();
      break;
  }
}

function gameOver() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      if (gBoard[i][j].isMine) {
        gBoard[i][j].isShown = true;
        renderCell({ i, j }, MINE);
      }
    }
  }
  clearInterval(gMyInterval);
}

function restartGame() {
location.reload();
}

function checkIfWon() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) return;
    }
  }
  clearInterval(gMyInterval);
  var elSmiley = document.querySelector(".smiley");
  elSmiley.innerText = "YOU WON😎";
  return true;
}

function setMinesAndNegs() {
  setRandomMines(gLevels[gCurrentLevel].MINES);
  calculateNeighborsForAllBoard(gLevels[gCurrentLevel].SIZE);
}
