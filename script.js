let uploadedFile = null;

document.getElementById('fileUpload').addEventListener('change', function (e) {
    uploadedFile = e.target.files[0];
});


function handleCompress() {
    if (!uploadedFile) {
        alert('Please upload a file first!');
        return;
    }


    if (uploadedFile.name.endsWith('.huff')) {
        alert('This file is already compressed!');
        return;
    }


    compressFile(uploadedFile);
}


function handleDecompress() {
    if (!uploadedFile) {
        alert('Please upload a file first!');
        return;
    }


    if (uploadedFile.name.endsWith('.txt')) {
        alert('This file is already decompressed!');
        return;
    }


    decompressFile(uploadedFile);
}


class Node {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

// Frequency + Tree Helpers
function getFrequency(text) {
    const freq = {};
    for (const char of text) {
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}

function buildTree(freq) {
    const nodes = Object.entries(freq).map(([char, freq]) => new Node(char, freq));
    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);
        const left = nodes.shift();
        const right = nodes.shift();
        nodes.push(new Node(null, left.freq + right.freq, left, right));
    }
    return nodes[0];
}

function generateCodes(node, prefix = '', codes = {}) {
    if (node.char !== null) {
        codes[node.char] = prefix;
        return;
    }
    generateCodes(node.left, prefix + '0', codes);
    generateCodes(node.right, prefix + '1', codes);
    return codes;
}

function encodeText(text, codes) {
    return text.split('').map(char => codes[char]).join('');
}

function binaryToBytes(binaryString) {
    const extraBits = (8 - (binaryString.length % 8)) % 8;
    binaryString = binaryString.padEnd(binaryString.length + extraBits, '0');

    const byteArray = new Uint8Array(binaryString.length / 8);
    for (let i = 0; i < binaryString.length; i += 8) {
        byteArray[i / 8] = parseInt(binaryString.slice(i, i + 8), 2);
    }

    return { byteArray, extraBits };
}

function decodeBinary(binaryString, root) {
    let result = '';
    let node = root;
    for (const bit of binaryString) {
        node = bit === '0' ? node.left : node.right;
        if (node.char !== null) {
            result += node.char;
            node = root;
        }
    }
    return result;
}


function compressFile(File) {


    const file = File;

    const reader = new FileReader();
    reader.onload = function (event) {
        const text = event.target.result;
        const freq = getFrequency(text);
        const tree = buildTree(freq);
        const codes = generateCodes(tree);
        const binaryString = encodeText(text, codes);

        const { byteArray, extraBits } = binaryToBytes(binaryString);

        const metadata = { freq, extraBits };
        const metadataStr = JSON.stringify(metadata);
        const metadataBytes = new TextEncoder().encode(metadataStr);
        const metadataLength = metadataBytes.length;

        const totalSize = 4 + metadataLength + byteArray.length;
        const finalArray = new Uint8Array(totalSize);

        finalArray[0] = (metadataLength >> 24) & 0xFF;
        finalArray[1] = (metadataLength >> 16) & 0xFF;
        finalArray[2] = (metadataLength >> 8) & 0xFF;
        finalArray[3] = metadataLength & 0xFF;

        finalArray.set(metadataBytes, 4);
        finalArray.set(byteArray, 4 + metadataLength);

        const blob = new Blob([finalArray], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.name.replace('.txt', '') + '.huff';
        link.click();
    };
    reader.readAsText(file);
}


function decompressFile(File) {


    const file = File;

    const reader = new FileReader();
    reader.onload = function (event) {
        const buffer = new Uint8Array(event.target.result);

        const metadataLength = (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];
        const metadataBytes = buffer.slice(4, 4 + metadataLength);
        const metadataStr = new TextDecoder().decode(metadataBytes);
        const metadata = JSON.parse(metadataStr);
        const { freq, extraBits } = metadata;

        const binaryData = buffer.slice(4 + metadataLength);
        let binaryString = '';
        for (const byte of binaryData) {
            binaryString += byte.toString(2).padStart(8, '0');
        }

        binaryString = binaryString.slice(0, binaryString.length - extraBits);
        const tree = buildTree(freq);
        const originalText = decodeBinary(binaryString, tree);

        const blob = new Blob([originalText], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file.name.replace('.huff', '') + '_decompressed.txt';
        link.click();
    };
    reader.readAsArrayBuffer(file);
}

