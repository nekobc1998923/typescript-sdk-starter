import LibraryStarter from '@/index';

describe('src/index.ts', () => {
  it('这里要判断 SDK 的参数初始化是否正确', () => {
    expect(new LibraryStarter({ id: 'GIQE-QWQE-VFFF', url: 'localhost' }).getConfig()).toStrictEqual({
      id: 'GIQE-QWQE-VFFF',
      url: 'localhost',
    });
  });
});
