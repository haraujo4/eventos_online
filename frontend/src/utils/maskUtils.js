
export const formatWithMask = (value, mask) => {
    if (!value) return '';
    if (!mask) return value;

    let i = 0; 
    let j = 0; 
    let output = '';
    const rawValue = value.toString().replace(/[^a-zA-Z0-9]/g, ''); 

    
    
    
    const cleanValue = value.toString();

    
    
    

    const buffer = cleanValue.replace(/[^a-zA-Z0-9]/g, '');
    let bufferIndex = 0;

    for (let k = 0; k < mask.length; k++) {
        if (bufferIndex >= buffer.length) break;

        const maskChar = mask[k];
        const char = buffer[bufferIndex];

        if (maskChar === '9') {
            if (/\d/.test(char)) {
                output += char;
                bufferIndex++;
            } else {
                
                
                
                
                bufferIndex++; 
                k--; 
            }
        } else if (maskChar === 'a') {
            if (/[a-zA-Z]/.test(char)) {
                output += char;
                bufferIndex++;
            } else {
                bufferIndex++;
                k--;
            }
        } else if (maskChar === '*') {
            if (/[a-zA-Z0-9]/.test(char)) {
                output += char;
                bufferIndex++;
            } else {
                bufferIndex++;
                k--;
            }
        } else {
            
            output += maskChar;
            
            if (char === maskChar) {
                bufferIndex++;
            }
        }
    }

    return output;
};
