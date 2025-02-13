/* eslint-disable import/first */
import React from 'react';
import { mount } from 'enzyme';

jest.mock('resize-observer-polyfill');
// @ts-ignore
import { triggerResizeObserver } from 'resize-observer-polyfill';
import ErrorBoundary from 'react-error-boundary';
import { SuperChart } from '../../src';
import RealSuperChart from '../../src/components/SuperChart';
import { ChartKeys, DiligentChartPlugin, BuggyChartPlugin } from './MockChartPlugins';
import promiseTimeout from './promiseTimeout';

function expectDimension(renderedWrapper: Cheerio, width: number, height: number) {
  expect(renderedWrapper.find('.dimension').text()).toEqual([width, height].join('x'));
}

describe('SuperChart', () => {
  const plugins = [
    new DiligentChartPlugin().configure({ key: ChartKeys.DILIGENT }),
    new BuggyChartPlugin().configure({ key: ChartKeys.BUGGY }),
  ];

  beforeAll(() => {
    plugins.forEach(p => {
      p.unregister().register();
    });
  });

  afterAll(() => {
    plugins.forEach(p => {
      p.unregister();
    });
  });

  describe('includes ErrorBoundary', () => {
    it('renders default FallbackComponent', () => {
      jest.spyOn(RealSuperChart.defaultProps, 'FallbackComponent');
      const wrapper = mount(<SuperChart chartType={ChartKeys.BUGGY} width="200" height="200" />);
      const renderedWrapper = wrapper.render();

      return promiseTimeout(() => {
        expect(renderedWrapper.find('div.test-component')).toHaveLength(0);
        expect(RealSuperChart.defaultProps.FallbackComponent).toHaveBeenCalledTimes(1);
      }, 100);
    });
    it('renders custom FallbackComponent', () => {
      const CustomFallbackComponent = jest.fn(() => <div>Custom Fallback!</div>);
      const wrapper = mount(
        <SuperChart
          chartType={ChartKeys.BUGGY}
          width="200"
          height="200"
          FallbackComponent={CustomFallbackComponent}
        />,
      );

      return promiseTimeout(() => {
        expect(wrapper.render().find('div.test-component')).toHaveLength(0);
        expect(CustomFallbackComponent).toBeCalledTimes(1);
      });
    });
    it('call onErrorBoundary', () => {
      const handleError = jest.fn();
      mount(
        <SuperChart
          chartType={ChartKeys.BUGGY}
          width="200"
          height="200"
          onErrorBoundary={handleError}
        />,
      );

      return promiseTimeout(() => {
        expect(handleError).toHaveBeenCalledTimes(1);
      });
    });
    it('does not include ErrorBoundary if told so', () => {
      const inactiveErrorHandler = jest.fn();
      const activeErrorHandler = jest.fn();
      mount(
        <ErrorBoundary onError={activeErrorHandler}>
          <SuperChart
            chartType={ChartKeys.BUGGY}
            width="200"
            height="200"
            disableErrorBoundary
            onErrorBoundary={inactiveErrorHandler}
          />
        </ErrorBoundary>,
      );

      return promiseTimeout(() => {
        expect(activeErrorHandler).toHaveBeenCalledTimes(1);
        expect(inactiveErrorHandler).toHaveBeenCalledTimes(0);
      });
    });
  });

  it('passes the props to renderer correctly', () => {
    const wrapper = mount(
      <SuperChart chartType={ChartKeys.DILIGENT} width={101} height={118} formData={{ abc: 1 }} />,
    );

    return promiseTimeout(() => {
      const renderedWrapper = wrapper.render();
      expect(renderedWrapper.find('div.test-component')).toHaveLength(1);
      expectDimension(renderedWrapper, 101, 118);
    });
  });

  describe('supports dynamic width and/or height', () => {
    it('works with width and height that are numbers', () => {
      const wrapper = mount(<SuperChart chartType={ChartKeys.DILIGENT} width={100} height={100} />);

      return promiseTimeout(() => {
        const renderedWrapper = wrapper.render();
        expect(renderedWrapper.find('div.test-component')).toHaveLength(1);
        expectDimension(renderedWrapper, 100, 100);
      });
    });
    it('works when width and height are percent', () => {
      const wrapper = mount(
        <SuperChart chartType={ChartKeys.DILIGENT} debounceTime={1} width="100%" height="100%" />,
      );
      triggerResizeObserver();

      return promiseTimeout(() => {
        const renderedWrapper = wrapper.render();
        expect(renderedWrapper.find('div.test-component')).toHaveLength(1);
        expectDimension(renderedWrapper, 300, 300);
      }, 100);
    });
    it('works when only width is percent', () => {
      const wrapper = mount(
        <SuperChart chartType={ChartKeys.DILIGENT} debounceTime={1} width="50%" height="125" />,
      );
      triggerResizeObserver();

      return promiseTimeout(() => {
        const renderedWrapper = wrapper.render();
        expect(renderedWrapper.find('div.test-component')).toHaveLength(1);
        expectDimension(renderedWrapper, 150, 125);
      }, 100);
    });
    it('works when only height is percent', () => {
      const wrapper = mount(
        <SuperChart chartType={ChartKeys.DILIGENT} debounceTime={1} width="50" height="25%" />,
      );
      triggerResizeObserver();

      return promiseTimeout(() => {
        const renderedWrapper = wrapper.render();
        expect(renderedWrapper.find('div.test-component')).toHaveLength(1);
        expectDimension(renderedWrapper, 50, 75);
      }, 100);
    });
    it('works when width and height are not specified', () => {
      const wrapper = mount(<SuperChart chartType={ChartKeys.DILIGENT} debounceTime={1} />);
      triggerResizeObserver();

      return promiseTimeout(() => {
        const renderedWrapper = wrapper.render();
        expect(renderedWrapper.find('div.test-component')).toHaveLength(1);
        expectDimension(renderedWrapper, 300, 400);
      }, 100);
    });
  });
});
