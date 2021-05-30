// const AWS = require('aws-sdk');
// const lambda = new AWS.Lambda();
// const Alexa = require('ask-sdk-core');

const CommonUtil = require('./CommonUtil.js');
const util = new CommonUtil();

const Constant = require('./Constant');
const c = new Constant();

// const uuid = require('node-uuid');

// 局面クラス
class Phase {

    // コンストラクタ
    constructor(initial) {
        if (initial) {
            // TODO 初期値を与えられたときの設定を追加
            console.log('aa');
        } else {
            // 初期盤面
            this._board = util.deepCopy(c.initialBoard);
            // 持ち駒
            this._ownPieceFirst = util.deepCopy(c.initialOwnPiece);
            this._ownPieceSecond = util.deepCopy(c.initialOwnPiece);
            // 履歴
            this._history = [];
            // どちらのプレイヤー先手かをランダムで決める
            this._firstPlayer = util.random(2) == 0 ? c.PLAYER_USER : c.PLAYER_ALEXA;
        }
    }

    // ------------ ゲッター ------------ 
    get history() {
        return this._history;
    }

    // 局面をログ表示する
    log() {
        let boardStr = '\n';
        for (let i = 0; i < this._board.length; i++) {
            for (let j = 0; j < this._board[i].length; j++) {
                if (!this._board[i][j]) {
                    boardStr += '  ';
                } else if (this._board[i][j].length == 1) {
                    boardStr += ` ${this._board[i][j]}`;
                } else {
                    boardStr += this._board[i][j];
                }
            }
            boardStr += '\n';
        }
        console.log(boardStr);
        // TODO 集約して1ログで表示
        console.log(this._ownPieceFirst);
        console.log(this._ownPieceSecond);
        console.log(this._history);
        console.log(this._firstPlayer);
    }

    // 先手がユーザーならtrueを返す
    isFirstPlayerUser() {
        return this._firstPlayer == c.PLAYER_USER ? true : false;
    }


}

module.exports = Phase;