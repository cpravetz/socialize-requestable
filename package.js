/* global Package */
Package.describe({
    name: 'socialize:requestable',
    version: '1.0.7',
    summary: 'Create models that are requestable',
    git: 'https://github.com/copleykj/socialize-requestable.git',
});

Package.onUse(function _(api) {
    api.versionsFrom(['1.10.2', '2.3','3.0']);

    api.use('socialize:linkable-model');

    api.mainModule('common/common.js');
});
