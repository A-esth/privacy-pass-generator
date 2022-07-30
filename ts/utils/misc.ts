
export function urlExtractor(e: string): URL | null {
    let f: Array<string> = e.match(/(?<=\(\").+?(?=\"\))/g) 
    return f ? new URL(f[0]) : null;
}

export function tokenFormatter(_badFormatTokenList: string): string{

    let goodFormatTokenList: Array<string> = []

    for(let i: number = 1; i < _badFormatTokenList.length-1; i++){
        const char: string = _badFormatTokenList[i]

        if(char==='\\'){

            if(_badFormatTokenList[i+1]==='\\'&&_badFormatTokenList[i+2]==='\\'){
                goodFormatTokenList.push('\\')
                i = i + 2
            }

            // This does not work.
            if(_badFormatTokenList[i-1]==='}'&& _badFormatTokenList[i-2]==='}'){
                continue
            }

            // This does not work.
            if(_badFormatTokenList[i-1]==='['){
                continue
            }

        } else {
            goodFormatTokenList.push(char)
        }


    }

    return goodFormatTokenList.join('')
}
