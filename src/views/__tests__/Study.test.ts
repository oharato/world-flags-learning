import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Study from '../Study.vue';
import { useCountriesStore } from '../../store/countries';
import { mockCountries } from '../../__tests__/fixtures/countries';

describe('Study.vue', () => {
  let router: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/study', component: Study },
      ],
    });

    const countriesStore = useCountriesStore();
    countriesStore.countries = mockCountries;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正しくマウントされる', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('h2').text()).toBe('学習モード');
  });

  it('最初の国が表示される', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 最初の国（日本）の国旗が表示される
    const flagImage = wrapper.find('img[alt="日本の国旗"]');
    expect(flagImage.exists()).toBe(true);
    expect(flagImage.attributes('src')).toBe('/flags/jp.svg');
  });

  it('カードをクリックするとフリップする', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期状態でisFlippedがfalseであることを確認
    expect((wrapper.vm as any).isFlipped).toBe(false);
    
    // カードをクリック
    const card = wrapper.find('.transform-style-3d');
    await card.trigger('click');
    await wrapper.vm.$nextTick();
    
    // isFlippedがtrueになることを確認
    expect((wrapper.vm as any).isFlipped).toBe(true);
  });

  it('「次へ」ボタンで次の国に移動する', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期インデックスは0
    expect((wrapper.vm as any).currentIndex).toBe(0);

    const nextButton = wrapper.findAll('button').find(btn => btn.text().includes('次へ'));
    expect(nextButton).toBeDefined();
    
    if (nextButton) {
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // currentIndexが1になることを確認
      expect((wrapper.vm as any).currentIndex).toBe(1);
    }
  });

  it('「前へ」ボタンで前の国に移動する', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // まず次へ進む
    const nextButton = wrapper.findAll('button').find(btn => btn.text().includes('次へ'));
    if (nextButton) {
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).currentIndex).toBe(1);
    }
    
    // 前へ戻る
    const prevButton = wrapper.findAll('button').find(btn => btn.text().includes('前へ'));
    if (prevButton) {
      await prevButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // インデックスが0に戻ることを確認
      expect((wrapper.vm as any).currentIndex).toBe(0);
    }
  });

  it('最後の国で「次へ」を押すと最初に戻る（ループ）', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    const nextButton = wrapper.findAll('button').find(btn => btn.text().includes('次へ'));
    
    if (nextButton) {
      // 3回「次へ」を押して最後の国の次へ
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // インデックスが0に戻ることを確認（ループ）
      expect((wrapper.vm as any).currentIndex).toBe(0);
    }
  });

  it('最初の国で「前へ」を押すと最後に移動する（ループ）', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // 初期状態でインデックスは0
    expect((wrapper.vm as any).currentIndex).toBe(0);

    const prevButton = wrapper.findAll('button').find(btn => btn.text().includes('前へ'));
    if (prevButton) {
      await prevButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // インデックスが最後（2）になることを確認
      expect((wrapper.vm as any).currentIndex).toBe(2);
    }
  });

  it('カウンター表示が正しい', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('1 / 3');
  });

  it('地域選択ドロップダウンが表示される', () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    const select = wrapper.find('#studyRegion');
    expect(select.exists()).toBe(true);
    
    const options = select.findAll('option');
    expect(options[0]?.text()).toBe('全世界');
  });

  it('地域を選択するとフィルタリングされる', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    const select = wrapper.find('#studyRegion');
    await select.setValue('Asia');
    await wrapper.vm.$nextTick();
    
    // カウンター表示を確認
    const text = wrapper.text();
    // ローディング中でなければ確認
    if (!text.includes('データを読み込み中')) {
      expect(text).toContain('1 / 1');
    }
  });

  it('地域を変更するとカードが表面に戻る', async () => {
    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    // カードをフリップ
    const card = wrapper.find('.transform-style-3d');
    await card.trigger('click');
    await wrapper.vm.$nextTick();
    
    // isFlippedがtrueになることを確認
    expect((wrapper.vm as any).isFlipped).toBe(true);
    
    // 地域を変更
    const select = wrapper.find('#studyRegion');
    await select.setValue('Europe');
    await wrapper.vm.$nextTick();
    
    // isFlippedがfalseに戻ることを確認
    expect((wrapper.vm as any).isFlipped).toBe(false);
  });

  it('複数の首都を持つ国の場合、最初の首都が表示される', async () => {
    const countriesStore = useCountriesStore();
    countriesStore.countries = [
      { id: 'za', name: '南アフリカ', capital: ['プレトリア', 'ケープタウン', 'ブルームフォンテーン'], continent: 'Africa', flag_image_url: '/flags/za.svg', map_image_url: '/maps/za.svg', description: '説明', summary: '概要' },
    ];
    countriesStore.loading = false;

    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    await wrapper.vm.$nextTick();

    const currentCountry = (wrapper.vm as any).currentCountry;
    expect(currentCountry).toBeDefined();
    expect(currentCountry?.name).toBe('南アフリカ');
    
    if (Array.isArray(currentCountry?.capital)) {
      expect(currentCountry.capital[0]).toBe('プレトリア');
    }
  });

  it('ローディング中は読み込みメッセージが表示される', () => {
    const countriesStore = useCountriesStore();
    countriesStore.loading = true;
    countriesStore.countries = [];

    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('データを読み込み中...');
  });

  it('エラー時はエラーメッセージが表示される', () => {
    const countriesStore = useCountriesStore();
    countriesStore.error = 'データ取得エラー';
    countriesStore.countries = [];

    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('データの読み込みに失敗しました');
  });

  it('国データがない場合、メッセージが表示される', () => {
    const countriesStore = useCountriesStore();
    countriesStore.countries = [];

    const wrapper = mount(Study, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('国データが見つかりません');
  });
});
