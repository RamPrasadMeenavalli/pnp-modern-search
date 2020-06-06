import * as React from                               'react';
import { ISearchBoxContainerProps } from             './ISearchBoxContainerProps';
import * as strings from                             'SearchBoxWebPartStrings';
import ISearchBoxContainerState from                 './ISearchBoxContainerState';
import { PageOpenBehavior, QueryPathBehavior, UrlHelper } from  '../../../../helpers/UrlHelper';
import { MessageBar, MessageBarType } from           'office-ui-fabric-react/lib/MessageBar';
import styles from '../SearchBoxWebPart.module.scss';
import { ITheme } from '@uifabric/styling';
import SearchBoxAutoComplete from '../SearchBoxAutoComplete/SearchBoxAutoComplete';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { IconButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react';

export default class SearchBoxContainer extends React.Component<ISearchBoxContainerProps, ISearchBoxContainerState> {

  private _srcUrl:string;
  private _srcTitle:string;
  private _scope:string;
  private _ref:string;

  public constructor(props: ISearchBoxContainerProps) {

    super(props);

    this._srcUrl = decodeURIComponent(UrlHelper.getQueryStringParam("source", window.location.href));
    this._srcTitle = decodeURIComponent(UrlHelper.getQueryStringParam("sourceTitle", window.location.href));
    this._scope = UrlHelper.getQueryStringParam("scope", window.location.href);
    this._ref = UrlHelper.getQueryStringParam("ref", window.location.href);

    this.state = {
      searchInputValue: (props.inputValue) ? decodeURIComponent(props.inputValue) : '',
      errorMessage: null,
      showClearButton: !!props.inputValue,
    };

    this._onSearch = this._onSearch.bind(this);
  }

  private renderSearchBoxWithAutoComplete(): JSX.Element {
    return (
      <SearchBoxAutoComplete
        inputValue={this.props.inputValue}
        onSearch={this._onSearch}
        placeholderText={this.props.placeholderText}
        suggestionProviders={this.props.suggestionProviders}
        themeVariant={this.props.themeVariant}
        domElement={this.props.domElement}
      />
    );
  }

  private renderBasicSearchBox(): JSX.Element {
    return (
      <div className={styles.searchBoxWrapper}>
        <SearchBox
          placeholder={this.props.placeholderText ? this.props.placeholderText : strings.SearchInputPlaceholder}
          theme={this.props.themeVariant as ITheme}
          className={ styles.searchTextField }
          value={ this.state.searchInputValue }
          autoComplete= "off"
          onChange={(value) => this.setState({ searchInputValue: value })}
          onSearch={() => this._onSearch(this.state.searchInputValue)}
          onClear={() => this._onSearch('', true)}
        />
        <div className={styles.searchButton}>
          {this.state.searchInputValue &&
            <IconButton
              onClick={() => this._onSearch(this.state.searchInputValue)}
              iconProps={{iconName: 'Forward' }}
            />
          }
        </div>
      </div>
    );
  }

  /**
   * Handler when a user enters new keywords
   * @param queryText The query text entered by the user
   */
  public async _onSearch(queryText: string, isReset: boolean = false) {

    // Don't send empty value
    if (queryText || isReset) {

      let query = queryText;

      this.setState({
        searchInputValue: queryText,
        showClearButton: !isReset
      });

      if (this.props.searchInNewPage && !isReset) {
        const urlEncodedQueryText = encodeURIComponent(queryText);

        const searchUrl = new URL(this.props.pageUrl);
        let newUrl;

        if (this.props.queryPathBehavior === QueryPathBehavior.URLFragment) {
          searchUrl.hash = urlEncodedQueryText;
          newUrl = searchUrl.href;
        }
        else {
          newUrl = UrlHelper.addOrReplaceQueryStringParam(searchUrl.href, this.props.queryStringParameter, urlEncodedQueryText);
        }

        // Send the query to the new page
        const behavior = this.props.openBehavior === PageOpenBehavior.NewTab ? '_blank' : '_self';
        window.open(newUrl, behavior);

      } else {

        // Notify the dynamic data controller
        this.props.onSearch(query);
      }
    }
  }


  public UNSAFE_componentWillReceiveProps(nextProps: ISearchBoxContainerProps) {
    this.setState({
      searchInputValue: decodeURIComponent(nextProps.inputValue),
    });
  }

  public render(): React.ReactElement<ISearchBoxContainerProps> {
    let renderErrorMessage: JSX.Element = null;

    if (this.state.errorMessage) {
      renderErrorMessage = <MessageBar messageBarType={ MessageBarType.error }
                                        dismissButtonAriaLabel='Close'
                                        isMultiline={ false }
                                        onDismiss={ () => {
                                          this.setState({
                                            errorMessage: null,
                                          });
                                        }}
                                        className={styles.errorMessage}>
                                        { this.state.errorMessage }</MessageBar>;
    }

    const renderSearchBox = this.props.enableQuerySuggestions ?
                          this.renderSearchBoxWithAutoComplete() :
                          this.renderBasicSearchBox();
    return (
      <div className={styles.searchBox}>
        { renderErrorMessage }
        { renderSearchBox }
        { (this._ref || this._scope) && (
          <div className={styles.scopeControls}>
            <ChoiceGroup
              label="Scope"
              options={[
                { key: 'ALL', text: 'All'},
                { key: 'SCOPED', text: this._srcTitle}
              ]}
              defaultSelectedKey={ this._scope && this._scope.length > 0 ? "SCOPED" : "ALL"}
              onChange={this._onScopeChange}
              className={styles.scopeContainer}
            ></ChoiceGroup>
            <DefaultButton href={this._srcUrl}>{this._srcTitle}</DefaultButton>
          </div>
        )}
        
      </div>
    );
  }

  private _onScopeChange(ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void {

    let newUrl:string = "";
    if(option.key == "ALL"){
      // When all is selected redirect to Search.aspx
      newUrl = window.location.href
        .replace('scope=','ref=')
        .replace('/ScopedSearch.aspx', '/Search.aspx');
    }
    else
    {
      //When scope is selected redirect to ScopedSearch.aspx
      newUrl = window.location.href
        .replace('ref=','scope=')
        .replace('/Search.aspx', '/ScopedSearch.aspx');;
    }
    window.location.href = newUrl;

  }
}
