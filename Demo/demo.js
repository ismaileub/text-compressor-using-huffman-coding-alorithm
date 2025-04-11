class Node {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

// Step 1: Build Frequency Map
function getFrequencies(str) {
    const freq = {};
    for (const char of str) {
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}

// Step 2: Build Huffman Tree
function buildTree(freq) {
    const nodes = Object.entries(freq).map(([char, freq]) => new Node(char, freq));

    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);

        const left = nodes.shift();
        const right = nodes.shift();

        const merged = new Node(null, left.freq + right.freq, left, right);
        nodes.push(merged);
    }

    return nodes[0];
}

// Step 3: Generate Codes
function generateCodes(node, path = "", codes = {}) {
    if (!node) return;

    if (node.char !== null) {
        codes[node.char] = path;
    }

    generateCodes(node.left, path + "0", codes);
    generateCodes(node.right, path + "1", codes);

    return codes;
}

// Step 4: Encode the String
function encode(str, codes) {
    return str.split('').map(char => codes[char]).join('');
}

// Step 5: Decode the Binary String
function decode(encoded, tree) {
    let decoded = '';
    let current = tree;

    for (const bit of encoded) {
        current = bit === '0' ? current.left : current.right;

        if (current.char !== null) {
            decoded += current.char;
            current = tree;
        }
    }

    return decoded;
}

// Example Usage
const input = "AAABBC";
const freqMap = getFrequencies(input);
const tree = buildTree(freqMap);
const codes = generateCodes(tree);
const encoded = encode(input, codes);
const decoded = decode(encoded, tree);

console.log("Original:", input);
console.log("Codes:", codes);
console.log("Encoded:", encoded);
console.log("Decoded:", decoded);
