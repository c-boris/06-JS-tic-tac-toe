class Morpion {
	humanPlayer = 'J1';
	iaPlayer = 'J2';
	gameOver = false;
	gridMap = [
			[null, null, null],
			[null, null, null],
			[null, null, null],
	];

	winningConfigurations = [
		// Lignes
		[[0, 0], [0, 1], [0, 2]],
		[[1, 0], [1, 1], [1, 2]],
		[[2, 0], [2, 1], [2, 2]],
		// Colonnes
		[[0, 0], [1, 0], [2, 0]],
		[[0, 1], [1, 1], [2, 1]],
		[[0, 2], [1, 2], [2, 2]],
		// Diagonales
		[[0, 0], [1, 1], [2, 2]],
		[[0, 2], [1, 1], [2, 0]],
];

isWinningConfiguration(player) {
		return this.winningConfigurations.some(config => {
				return config.every(([x, y]) => this.gridMap[y][x] === player);
		});
}

makeMove(x, y, player) {
		if (this.gridMap[y][x] === null) {
				this.gridMap[y][x] = player;
				this.updateGridUI();
		}
}

	constructor(firstPlayer = 'J1') {
			this.humanPlayer = firstPlayer;
			this.iaPlayer = (firstPlayer === 'J1') ? 'J2' : 'J1';
			this.initGame();
	}

	initGame = () => {
			this.gridMap.forEach((line, y) => {
					line.forEach((cell, x) => {
							this.getCell(x, y).onclick = () => {
									this.doPlayHuman(x, y);
							};
					});
			});

			if (this.iaPlayer === 'J1') {
					// Au lieu de cela, appelez la méthode pour que l'IA joue avec l'arbre des possibilités
					this.playWithTree();
			}
	}

	getCell = (x, y) => {
			const column = x + 1;
			const lines = ['A', 'B', 'C'];
			const cellId = `${lines[y]}${column}`;
			return document.getElementById(cellId);
	}

	getBoardWinner = (board) => {
			const isWinningRow = ([a, b, c]) => (
					a !== null && a === b && b === c
			);

			let winner = null;

			// Horizontal
			board.forEach((line) => {
					if (isWinningRow(line)) {
							winner = line[0];
					}
			});

			// Vertical
			[0, 1, 2].forEach((col) => {
					if (isWinningRow([board[0][col], board[1][col], board[2][col]])) {
							winner = board[0][col];
					}
			});

			if (winner) {
					return winner;
			}

			// Diagonal
			const diagonal1 = [board[0][0], board[1][1], board[2][2]];
			const diagonal2 = [board[0][2], board[1][1], board[2][0]];
			if (isWinningRow(diagonal1) || isWinningRow(diagonal2)) {
					return board[1][1];
			}

			const isFull = board.every((line) => (
					line.every((cell) => cell !== null)
			));
			return isFull ? 'tie' : null;
	}

	checkWinner = (lastPlayer) => {
			const winner = this.getBoardWinner(this.gridMap);
			if (!winner) {
					return;
			}

			this.gameOver = true;
			switch (winner) {
					case 'tie':
							this.displayEndMessage("Vous êtes à égalité !");
							break;
					case this.iaPlayer:
							this.displayEndMessage("L'IA a gagné !");
							break;
					case this.humanPlayer:
							this.displayEndMessage("Tu as battu l'IA !");
							break;
			}
	}

	displayEndMessage = (message) => {
			const endMessageElement = document.getElementById('end-message');
			endMessageElement.textContent = message;
			endMessageElement.style.display = 'block';
	}

	drawHit = (x, y, player) => {
			if (this.gridMap[y][x] !== null) {
					return false;
			}

			this.gridMap[y][x] = player;
			this.getCell(x, y).classList.add(`filled-${player}`);
			this.checkWinner(player);
			return true;
	}

	doPlayHuman = (x, y) => {
			if (this.gameOver) {
					return;
			}

			if (this.drawHit(x, y, this.humanPlayer)) {
					this.doPlayIa();
			}
	}

	doPlayIa = () => {
			if (this.gameOver) {
					return;
			}

			// Créez une liste des positions vides dans la grille
			const emptyPositions = [];

			this.gridMap.forEach((line, y) => {
					line.forEach((cell, x) => {
							if (!cell) {
									emptyPositions.push({ x, y });
							}
					});
			});

			if (emptyPositions.length > 0) {
					// Sélectionnez une position aléatoire
					const randomPositionIndex = Math.floor(Math.random() * emptyPositions.length);
					const randomPosition = emptyPositions[randomPositionIndex];

					// Jouez à cet emplacement
					this.drawHit(randomPosition.x, randomPosition.y, this.iaPlayer);
			}
	}

	isBlockingMove(board, player, x, y) {
			// Clonez la grille pour effectuer une simulation
			const cloneGrid = this.cloneGrid(board);

			// Vérifiez si ce coup bloque une victoire potentielle de l'adversaire
			cloneGrid[y][x] = player;

			// Vérifiez s'il y a une victoire possible pour l'adversaire après ce coup
			const opponent = player === this.humanPlayer ? this.iaPlayer : this.humanPlayer;
			return this.getBoardWinner(cloneGrid) === opponent;
	}

	generatePossibilityTree(node, currentPlayer, depth) {
			if (depth === 0) {
					return;
			}

			for (let y = 0; y < 3; y++) {
					for (let x = 0; x < 3; x++) {
							if (node.board[y][x] === null) {
									const childNode = new Node();
									childNode.board = JSON.parse(JSON.stringify(node.board)); // Clone the board
									childNode.board[y][x] = currentPlayer;

									node.children.push(childNode);

									// Recursively generate the tree for the next player
									this.generatePossibilityTree(childNode, currentPlayer === 'J1' ? 'J2' : 'J1', depth - 1);
							}
					}
			}
	}

	playWithTree() {
    if (this.gameOver) {
        return;
    }

    // Créez une liste des positions vides dans la grille
    const emptyPositions = [];

    this.gridMap.forEach((line, y) => {
        line.forEach((cell, x) => {
            if (!cell) {
                emptyPositions.push({ x, y });
            }
        });
    });

    if (emptyPositions.length > 0) {
        let bestMove = null;
        let bestScore = -Infinity;

        // Parcourez les positions vides pour trouver le meilleur coup
        emptyPositions.forEach((position) => {
            const x = position.x;
            const y = position.y;

            // Clonez la grille pour effectuer une simulation
            const cloneGrid = this.cloneGrid(this.gridMap);
            cloneGrid[y][x] = this.iaPlayer;

            // Vérifiez si ce coup bloque une victoire potentielle de l'adversaire
            if (this.isBlockingMove(cloneGrid, this.humanPlayer, x, y)) {
                // Bloquer ce coup est prioritaire, donc sélectionnez-le immédiatement
                this.drawHit(x, y, this.iaPlayer);
                return;
            }

            // Évaluez le score en utilisant Minimax
            const score = this.minimax(cloneGrid, false);

            if (score > bestScore) {
                bestScore = score;
                bestMove = position;
            }
        });

        // Jouez le meilleur coup
        if (bestMove) {
            this.drawHit(bestMove.x, bestMove.y, this.iaPlayer);
        }
    }
}


	updateGridUI() {
			// Parcourez la grille et mettez à jour l'interface utilisateur en conséquence
			this.gridMap.forEach((line, y) => {
					line.forEach((cell, x) => {
							const cellElement = this.getCell(x, y);
							if (cell === this.humanPlayer) {
									cellElement.classList.add(`filled-${this.humanPlayer}`);
							} else if (cell === this.iaPlayer) {
									cellElement.classList.add(`filled-${this.iaPlayer}`);
							}
					});
			});
	}

	// Fonction Minimax pour évaluer les scores
	minimax(node, isMaximizing) {
			const winner = this.getBoardWinner(node);

			if (winner === this.iaPlayer) {
					return 1;
			} else if (winner === this.humanPlayer) {
					return -1;
			} else if (winner === 'tie') {
					return 0;
			}

			if (isMaximizing) {
					let bestScore = -Infinity;
					for (const child of node.children) {
							const score = this.minimax(child, false);
							bestScore = Math.max(bestScore, score);
					}
					return bestScore;
			} else {
					let bestScore = Infinity;
					for (const child of node.children) {
							const score = this.minimax(child, true);
							bestScore = Math.min(bestScore, score);
					}
					return bestScore;
			}
	}

	cloneGrid(grid) {
			return grid.map((row) => row.slice());
	}
}

class Node {
	board = [
			[null, null, null],
			[null, null, null],
			[null, null, null],
	];
	children = [];
}

class MorpionTree {
	root = new Node();
}

const morpion = new Morpion('J1');
