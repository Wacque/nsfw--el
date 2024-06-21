import { Dispatch, SetStateAction } from 'react';

export const getLatestState = function<T> (dispatch: Dispatch<SetStateAction<T>>):Promise<T> {
    return new Promise<T>( (resolve) => {
        dispatch(prevState => {
            resolve(prevState);

            return prevState;
        });
    });
};

export function compressCode(code: string) {
    // 移除注释
    const noComments = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    // 移除多余的空格和换行符
    const noSpaces = noComments.replace(/\s+/g, ' ');

    // 移除字符串内的空格
    const noStringSpaces = noSpaces.replace(/("[^"]*")|('[^']*')/g, (match) => match.replace(/[ ]+/g, ''));

    // 移除行尾的分号
    const noSemicolons = noStringSpaces.replace(/;\s*([}])/g, '$1');

    // 移除多余的分号
    const finalCode = noSemicolons.replace(/;+\s*/g, ';');

    return finalCode.trim();
}
