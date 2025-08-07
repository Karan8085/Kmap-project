document.addEventListener('DOMContentLoaded', () => {
    const variableSelect = document.getElementById('variable-select');
    const solveButton = document.getElementById('solve-button');
    const resetButton = document.getElementById('reset-button');
    const kmapWrapper = document.getElementById('kmap-wrapper');
    const solutionText = document.getElementById('solution');
    const explanationContainer = document.getElementById('explanation-container');

    let numVars = 4;
    let cells = [];
    const groupColors = ['Yellow/Orange', 'Green', 'Red', 'Purple', 'Blue', 'Orange', 'Teal', 'Pink'];

    const createKMap = () => {
        kmapWrapper.innerHTML = '';
        solutionText.textContent = '';
        explanationContainer.innerHTML = '';
        cells = [];

        let rows, cols, rowLabels, colLabels;
        
        if (numVars === 2) {
            rows = 2; cols = 2;
            rowLabels = ['0', '1']; colLabels = ['0', '1'];
        } else if (numVars === 3) {
            rows = 2; cols = 4;
            rowLabels = ['0', '1']; colLabels = ['00', '01', '11', '10'];
        } else { // 4 variables
            rows = 4; cols = 4;
            rowLabels = ['00', '01', '11', '10']; colLabels = ['00', '01', '11', '10'];
        }
        
        const kmapContainer = document.createElement('div');
        kmapContainer.id = 'kmap-container';
        kmapContainer.style.position = 'relative';
        kmapContainer.style.width = '100%';
        
        const grid = document.createElement('div');
        grid.className = 'kmap-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        for (let r = 0; r < rows; r++) {
            const rowArr = [];
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'kmap-cell';
                
                // Create the text node for '0', '1', 'X'
                const cellText = document.createElement('span');
                cellText.textContent = '0';
                cell.appendChild(cellText);
                
                cell.addEventListener('click', () => {
                    cellText.textContent = cellText.textContent === '0' ? '1' : (cellText.textContent === '1' ? 'X' : '0');
                });
                
                // Add border containers
                const borderTop = document.createElement('div');
                borderTop.className = 'border-container border-top';
                const borderRight = document.createElement('div');
                borderRight.className = 'border-container border-right';
                const borderBottom = document.createElement('div');
                borderBottom.className = 'border-container border-bottom';
                const borderLeft = document.createElement('div');
                borderLeft.className = 'border-container border-left';

                // NEW: Add dot container
                const dotContainer = document.createElement('div');
                dotContainer.className = 'dot-container';

                cell.append(borderTop, borderRight, borderBottom, borderLeft, dotContainer);

                grid.appendChild(cell);
                rowArr.push(cell);
            }
            cells.push(rowArr);
        }
        kmapContainer.appendChild(grid);
        kmapWrapper.appendChild(kmapContainer);
        addLabels(rowLabels, colLabels);
    };
    
    const addLabels = (rowLabels, colLabels) => {
        let sideVarName, topVarName;

        if (numVars === 2) { sideVarName = 'A'; topVarName = 'B'; } 
        else if (numVars === 3) { sideVarName = 'A'; topVarName = 'BC'; }
        else {  
            sideVarName = 'AB'; 
            topVarName = 'CD';
        }

        const rowBitLabelContainer = document.createElement('div');
        rowBitLabelContainer.className = 'labels row-bit-labels';
        rowLabels.forEach(label => {
            const div = document.createElement('div'); div.textContent = label;
            rowBitLabelContainer.appendChild(div);
        });

        const colBitLabelContainer = document.createElement('div');
        colBitLabelContainer.className = 'labels col-bit-labels';
        colLabels.forEach(label => {
            const div = document.createElement('div'); div.textContent = label;
            colBitLabelContainer.appendChild(div);
        });
        
        const sideVars = document.createElement('div');
        sideVars.className = 'labels var-label-side';
        sideVars.textContent = sideVarName;

        const topVars = document.createElement('div');
        topVars.className = 'labels var-label-top';
        topVars.textContent = topVarName;

        kmapWrapper.append(rowBitLabelContainer, colBitLabelContainer, sideVars, topVars);
    };

    // MODIFIED: Function to clear all visualizations (borders and dots)
    const clearVisualization = () => {
        for (const row of cells) {
            for (const cell of row) {
                cell.querySelectorAll('.border-container, .dot-container').forEach(container => {
                    container.innerHTML = '';
                });
            }
        }
    };
    
    const solveKMap = () => {
        clearVisualization();
        const rows = cells.length, cols = cells[0].length;
        const minterms = [];
        explanationContainer.innerHTML = '<h2>Explanation of Terms:</h2>';

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                if (cells[r][c].querySelector('span').textContent !== '0') {
                    minterms.push({r, c});
                }
            }
        }
        
        if (minterms.length === 0) { solutionText.textContent = "0"; explanationContainer.innerHTML = ''; return; }
        if (minterms.length === rows * cols) { solutionText.textContent = "1"; explanationContainer.innerHTML = ''; return; }

        const groups = findGroups(minterms, rows, cols);
        const essentialTerms = selectEssentialGroups(groups, minterms);
        
        const finalExpression = essentialTerms.map(term => termToExpression(term)).join(' + ');
        solutionText.textContent = finalExpression || '0';
        
        if (essentialTerms.length === 0) {
            explanationContainer.innerHTML = '';
        }

        // Call both drawing functions for the hybrid visualization
        drawGroupBorders(essentialTerms);
        drawGroupDots(essentialTerms);

        essentialTerms.forEach((group, i) => {
            const explanation = getTermExplanation(group, i);
            explanationContainer.innerHTML += explanation;
        });
    };

    const drawGroupBorders = (groups) => {
        const rows = cells.length;
        const cols = cells[0].length;

        groups.forEach((group, groupIndex) => {
            const groupMintermSet = new Set(group.minterms.map(mt => `${mt.r},${mt.c}`));
            const colorClass = `group-color-${groupIndex % groupColors.length}`;

            group.minterms.forEach(minterm => {
                const { r, c } = minterm;
                const cell = cells[r][c];

                const topNeighbor = `${(r - 1 + rows) % rows},${c}`;
                if (!groupMintermSet.has(topNeighbor)) {
                    const segment = document.createElement('div');
                    segment.className = `border-segment ${colorClass}`;
                    cell.querySelector('.border-top').appendChild(segment);
                }

                const bottomNeighbor = `${(r + 1) % rows},${c}`;
                if (!groupMintermSet.has(bottomNeighbor)) {
                    const segment = document.createElement('div');
                    segment.className = `border-segment ${colorClass}`;
                    cell.querySelector('.border-bottom').appendChild(segment);
                }

                const leftNeighbor = `${r},${(c - 1 + cols) % cols}`;
                if (!groupMintermSet.has(leftNeighbor)) {
                    const segment = document.createElement('div');
                    segment.className = `border-segment ${colorClass}`;
                    cell.querySelector('.border-left').appendChild(segment);
                }

                const rightNeighbor = `${r},${(c + 1) % cols}`;
                if (!groupMintermSet.has(rightNeighbor)) {
                    const segment = document.createElement('div');
                    segment.className = `border-segment ${colorClass}`;
                    cell.querySelector('.border-right').appendChild(segment);
                }
            });
        });
    };

    // NEW: Function to draw the dots for all groups
    const drawGroupDots = (groups) => {
        groups.forEach((group, groupIndex) => {
            const colorClass = `group-color-${groupIndex % groupColors.length}`;
            group.minterms.forEach(minterm => {
                const { r, c } = minterm;
                const cell = cells[r][c];
                const dot = document.createElement('div');
                dot.className = `group-dot ${colorClass}`;
                cell.querySelector('.dot-container').appendChild(dot);
            });
        });
    };
    
    const findGroups = (minterms, rows, cols) => {
        const implicants = [];
        const checked = new Set();
        const mintermMap = new Map(minterms.map(mt => [`${mt.r},${mt.c}`, mt]));
        
        for(let h = rows; h > 0; h /= 2){
            for(let w = cols; w > 0; w /= 2){
                if (h*w === 0) continue;
                for(let r_start = 0; r_start < rows; r_start++){
                    for(let c_start = 0; c_start < cols; c_start++){
                        const group = []; let isValid = true;
                        for(let r = 0; r < h; r++){
                            for(let c = 0; c < w; c++){
                                const cur_r = (r_start + r) % rows;
                                const cur_c = (c_start + c) % cols;
                                if(mintermMap.has(`${cur_r},${cur_c}`)){
                                    group.push(mintermMap.get(`${cur_r},${cur_c}`));
                                } else { isValid = false; break; }
                            }
                            if(!isValid) break;
                        }
                        if(isValid && group.length === h*w){
                            const key = group.map(m=>`${m.r},${m.c}`).sort().join(';');
                            if(!checked.has(key)){
                                implicants.push({minterms: group, size: group.length});
                                checked.add(key);
                            }
                        }
                    }
                }
            }
        }
        return implicants.sort((a, b) => b.size - a.size || a.minterms.length - b.minterms.length);
    };

    const selectEssentialGroups = (groups, minterms) => {
        const uncoveredMinterms = new Set(minterms.map(mt => `${mt.r},${mt.c}`));
        const finalGroups = [];
        
        for(const group of groups){
            const mintermCoords = group.minterms.map(mt => `${mt.r},${mt.c}`);
            const coversNew = mintermCoords.some(coord => uncoveredMinterms.has(coord));
            if(coversNew){
                finalGroups.push(group);
                mintermCoords.forEach(coord => uncoveredMinterms.delete(coord));
            }
            if(uncoveredMinterms.size === 0) break;
        }
        return finalGroups;
    };
    
    const getBinaryRepresentation = (cell) => {
        const rowMap = ['00', '01', '11', '10'], colMap = ['00', '01', '11', '10'];
        if(numVars === 2) return rowMap[cell.r].slice(1) + colMap[cell.c].slice(1);
        if(numVars === 3) return rowMap[cell.r].slice(1) + colMap[cell.c];
        return rowMap[cell.r] + colMap[cell.c];
    };

    const termToExpression = (group) => {
        const binaryReps = group.minterms.map(getBinaryRepresentation);
        let vars;
        if (numVars === 2) vars = ['A', 'B'];
        else if (numVars === 3) vars = ['A', 'B', 'C'];
        else vars = ['A', 'B', 'C', 'D'];

        let expression = '';
        for (let i = 0; i < numVars; i++) {
            const firstBit = binaryReps[0][i];
            if (binaryReps.every(br => br[i] === firstBit)) {
                expression += vars[i] + (firstBit === '0' ? "'" : "");
            }
        }
        return expression || '1';
    };

    const getTermExplanation = (group, groupIndex) => {
        const binaryReps = group.minterms.map(getBinaryRepresentation);
         let vars;
        if (numVars === 2) vars = ['A', 'B'];
        else if (numVars === 3) vars = ['A', 'B', 'C'];
        else vars = ['A', 'B', 'C', 'D'];
        let explanation = `<p><b>Group ${groupIndex + 1} (${groupColors[groupIndex % groupColors.length]}):</b><br/>`;
        
        for (let i = 0; i < numVars; i++) {
            const firstBit = binaryReps[0][i];
            if (binaryReps.every(br => br[i] === firstBit)) {
                explanation += `&bull; For variable <b>${vars[i]}</b>, the bit is always <b>${firstBit}</b>. This gives the term <b>${vars[i]}${firstBit === '0' ? "'" : ""}</b>.<br/>`;
            } else {
                explanation += `&bull; For variable <b>${vars[i]}</b>, the bits change within the group, so it is eliminated.<br/>`;
            }
        }
        explanation += `Resulting Term: <b>${termToExpression(group)}</b></p>`;
        return explanation;
    };

    variableSelect.addEventListener('change', (e) => {
        numVars = parseInt(e.target.value);
        createKMap();
    });

    solveButton.addEventListener('click', solveKMap);
    resetButton.addEventListener('click', createKMap);

    createKMap(); // Initial setup
});
