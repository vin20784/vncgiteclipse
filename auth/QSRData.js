'use strict';

class QSRData {

    constructor(OptionBodyBuild) {
        this.body = {
            state: OptionBodyBuild.state || 'Created' ,
            policy: OptionBodyBuild.policy || 'DSXQSR_StandardPolicy',
            type: OptionBodyBuild.type || 'DSXQSR_QSR',
            description: OptionBodyBuild.description || '',
            vault: OptionBodyBuild.vault || 'eService Production',
            owner: OptionBodyBuild.owner ,
            originator: OptionBodyBuild.originator || '',
            title: OptionBodyBuild.title ,
            comment: OptionBodyBuild.comment || '',
            qsrtype: OptionBodyBuild.qsrType || { value: 'MKCA', intlValue: 'MKCA' },
            unfixedErrors: OptionBodyBuild.unfixedErrors || OptionBodyBuild.errors || '',
            FixedErrors: OptionBodyBuild.fixedErrors || ''
        }
    }

}

module.exports = QSRData;
